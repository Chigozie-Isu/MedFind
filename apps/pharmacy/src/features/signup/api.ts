'use client';

/** Supabase calls for the 4 pharmacy sign-up steps. Rules live in @medfind/core and the database. */
import { normaliseEmail, type PharmacyApplicationStatus, type PharmacyDocumentKind } from '@medfind/core';
import { attempt, client, OFFLINE, supabase, supabaseAnonKey, supabaseUrl, type ApiResult } from '../../lib/supabase';

export interface ApplicationPharmacy {
  id: string;
  name: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string;
  landmark: string | null;
  superintendent_name: string;
  pcn_number: string;
  email: string;
  lat: number;
  lng: number;
  application_status: PharmacyApplicationStatus;
  submitted_at: string | null;
}

export interface ApplicationDocument {
  id: string;
  kind: PharmacyDocumentKind;
  file_name: string;
  size_bytes: number;
  storage_path: string;
}

export interface ApplicationPayout {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  verified: boolean;
}

export interface Application {
  pharmacy: ApplicationPharmacy;
  documents: ApplicationDocument[];
  payout: ApplicationPayout | null;
}

export async function signedInEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function loadApplication(): Promise<Application | null> {
  if (!supabase) return null;
  const { data } = await supabase.rpc('my_pharmacy_application');
  return (data as Application | null) ?? null;
}

// ---------- step 1 ----------

export async function emailInUse(email: string): Promise<ApiResult<boolean>> {
  return attempt(async () => {
    const { data, error } = await client().rpc('sign_up_precheck', { p_email: normaliseEmail(email) });
    if (error) return { ok: false, reason: OFFLINE };
    return { ok: true, value: (data as { email_in_use: boolean }).email_in_use };
  }, false);
}

/** Creates the owner's sign-in. Owners aren't customers (the database checks account_type). */
export async function createOwnerAccount(email: string, password: string, fullName: string): Promise<ApiResult> {
  return attempt(async () => {
    const { data, error } = await client().auth.signUp({
      email: normaliseEmail(email),
      password,
      options: { data: { account_type: 'pharmacy_owner', full_name: fullName.trim() } },
    });
    if (error) return { ok: false, reason: /registered|exists/i.test(error.message) ? 'email_in_use' : OFFLINE };
    if (!data.session) return { ok: false, reason: 'Check your email to confirm your account, then sign in.' };
    return { ok: true, value: undefined };
  });
}

export interface DetailsPayload {
  name: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string;
  landmark: string;
  lat: number;
  lng: number;
  superintendent_name: string;
  pcn_number: string;
  email: string;
}

/** The web demo has no database, so it remembers the name for the payout account check. */
let demoPharmacyName = 'Fuasi Pharmacy';

export async function saveDetails(details: DetailsPayload): Promise<ApiResult<string>> {
  demoPharmacyName = details.name.trim() || demoPharmacyName;
  return attempt(async () => {
    const { data, error } = await client().rpc('save_pharmacy_details', { p_details: details as never });
    if (error) return { ok: false, reason: /pcn_in_use/.test(error.message) ? 'pcn_in_use' : OFFLINE };
    return { ok: true, value: data as string };
  }, 'demo-pharmacy');
}

// ---------- step 2 ----------

export interface UploadHandle {
  done: Promise<ApiResult<string>>;
  cancel: () => void;
}

/**
 * Uploads to the private pharmacy-documents bucket with progress (the storage REST endpoint via
 * XMLHttpRequest, since supabase-js has no progress events), then records it on the application.
 */
export function uploadDocument(
  pharmacyId: string,
  kind: PharmacyDocumentKind,
  file: File,
  onProgress: (fraction: number) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();
  const safeName = file.name.replace(/[^\w.\-]+/g, '-').slice(-80);
  const path = `${pharmacyId}/${kind}/${Date.now()}-${safeName}`;
  const done = (async (): Promise<ApiResult<string>> => {
    const sb = supabase;
    if (!sb) {
      // Web demo: pretend to upload so the step can be completed.
      for (const f of [0.3, 0.7, 1]) {
        await new Promise((r) => setTimeout(r, 200));
        onProgress(f);
      }
      return { ok: true, value: `demo-${path}` };
    }
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, reason: 'Sign in again to upload.' };
    const status = await new Promise<number>((resolve) => {
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/pharmacy-documents/${path.split('/').map(encodeURIComponent).join('/')}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => resolve(xhr.status);
      xhr.onerror = () => resolve(0);
      xhr.onabort = () => resolve(-1);
      xhr.send(file);
    });
    if (status === -1) return { ok: false, reason: 'cancelled' };
    if (status < 200 || status >= 300) return { ok: false, reason: 'upload_failed' };
    const { data: id, error } = await sb.rpc('add_pharmacy_document', {
      p_kind: kind,
      p_storage_path: path,
      p_file_name: file.name,
      p_size_bytes: file.size,
      p_mime_type: file.type,
    });
    if (error) return { ok: false, reason: 'upload_failed' };
    return { ok: true, value: id as string };
  })();
  return { done, cancel: () => xhr.abort() };
}

export async function removeDocument(id: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().rpc('remove_pharmacy_document', { p_document_id: id });
    return error ? { ok: false, reason: OFFLINE } : { ok: true, value: undefined };
  });
}

// ---------- step 3 ----------

export interface Bank {
  name: string;
  code: string;
}

export async function listBanks(): Promise<ApiResult<{ banks: Bank[]; testMode: boolean }>> {
  return attempt(async () => {
    const { data, error } = await client().functions.invoke('paystack-banks', { method: 'GET' });
    if (error || !data?.banks) return { ok: false, reason: 'We couldn’t load the bank list. Try again.' };
    return { ok: true, value: { banks: data.banks as Bank[], testMode: !!data.test_mode } };
  }, {
    banks: [
      { name: 'Access Bank', code: '044' },
      { name: 'First Bank of Nigeria', code: '011' },
      { name: 'Guaranty Trust Bank', code: '058' },
      { name: 'United Bank For Africa', code: '033' },
      { name: 'Zenith Bank', code: '057' },
    ],
    testMode: true,
  });
}

export type ResolveResult = { accountName: string; matches: boolean; businessName: string };

/** Asks Paystack whose account it is; the server saves it only when the name matches. */
export async function resolveAccount(bank: Bank, accountNumber: string): Promise<ApiResult<ResolveResult>> {
  return attempt(async () => {
    const { data, error } = await client().functions.invoke('paystack-resolve-account', {
      body: { bank_code: bank.code, bank_name: bank.name, account_number: accountNumber.replace(/\s/g, '') },
    });
    if (error) {
      let code = '';
      try {
        const body = await (error as { context?: Response }).context?.json();
        code = body?.code ?? '';
      } catch {
        // Not JSON: treat as unavailable.
      }
      return { ok: false, reason: code === 'not_found' ? 'not_found' : 'We couldn’t reach the bank. Try again in a moment.' };
    }
    return { ok: true, value: { accountName: data.account_name, matches: data.matches, businessName: data.business_name } };
  }, { accountName: `${demoPharmacyName.toUpperCase()} LTD`, matches: true, businessName: demoPharmacyName });
}

// ---------- step 4 ----------

/** Submits for review and returns the owner's 5-digit staff passcode (shown once). */
export async function submitApplication(): Promise<ApiResult<string>> {
  return attempt(async () => {
    const { data, error } = await client().rpc('submit_pharmacy_application');
    if (error) return { ok: false, reason: error.message || OFFLINE };
    return { ok: true, value: data as string };
  }, '48291');
}
