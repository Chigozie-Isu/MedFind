// POST { bank_code, bank_name, account_number }: asks Paystack whose account it is, checks the name
// matches the signed-in owner's pharmacy (in the database, private.account_name_matches), and saves
// it as the payout account if it does.
// Answers { account_name, matches } or { error, code: 'not_found' | 'bad_request' | ... }.
// Talks to Auth and PostgREST with plain fetch, so the function has no npm imports to download at boot.
import { corsHeaders, json, resolveAccountName } from '../_shared/paystack.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

async function userIdFor(token: string): Promise<string | null> {
  if (!token) return null;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

async function draftPharmacyName(userId: string): Promise<string | null> {
  const q = new URLSearchParams({
    select: 'pharmacies!inner(name,application_status)',
    user_id: `eq.${userId}`,
    role: 'eq.owner',
    limit: '1',
  });
  const res = await fetch(`${url}/rest/v1/pharmacy_staff?${q}`, { headers: admin });
  if (!res.ok) return null;
  const rows = (await res.json()) as { pharmacies: { name: string; application_status: string } }[];
  const p = rows[0]?.pharmacies;
  return p && p.application_status === 'draft' ? p.name : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST', code: 'bad_request' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const userId = await userIdFor(token);
  if (!userId) return json({ error: 'Sign in first', code: 'unauthorised' }, 401);

  let body: { bank_code?: string; bank_name?: string; account_number?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Send JSON', code: 'bad_request' }, 400);
  }
  const accountNumber = (body.account_number ?? '').replace(/\s/g, '');
  const bankCode = body.bank_code ?? '';
  const bankName = body.bank_name ?? '';
  if (!/^\d{10}$/.test(accountNumber) || !bankCode || !bankName) {
    return json({ error: 'Choose a bank and enter the 10-digit account number', code: 'bad_request' }, 400);
  }

  const pharmacyName = await draftPharmacyName(userId);
  if (!pharmacyName) return json({ error: 'Finish your pharmacy details first', code: 'no_draft' }, 409);

  let accountName: string | null;
  try {
    accountName = await resolveAccountName(accountNumber, bankCode, pharmacyName);
  } catch (e) {
    console.error('paystack-resolve-account', e);
    return json({ error: 'We couldn’t reach the bank. Try again in a moment.', code: 'unavailable' }, 502);
  }
  if (!accountName) return json({ error: 'We couldn’t find this account. Check the bank and number.', code: 'not_found' }, 404);

  const saved = await fetch(`${url}/rest/v1/rpc/save_verified_payout_account`, {
    method: 'POST',
    headers: admin,
    body: JSON.stringify({
      p_user: userId,
      p_bank_name: bankName,
      p_bank_code: bankCode,
      p_account_number: accountNumber,
      p_account_name: accountName,
    }),
  });
  if (!saved.ok) {
    console.error('save_verified_payout_account', saved.status, await saved.text());
    return json({ error: 'We couldn’t save this account. Try again.', code: 'save_failed' }, 500);
  }
  const matches = (await saved.json()) === true;
  return json({ account_name: accountName, matches, business_name: pharmacyName });
});
