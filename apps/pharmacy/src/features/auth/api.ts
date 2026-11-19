'use client';

/**
 * Supabase calls for pharmacy Sign in and Forgot password. Staff sign in with email, password
 * and their 5-digit staff passcode; all three must match. An owner whose application is still
 * a draft has no passcode yet and goes back to sign up.
 */
import { normaliseEmail, type PharmacySignInFailure } from '@medfind/core';
import { attempt, client, myStaffState, OFFLINE, supabase, type ApiResult } from '../../lib/supabase';

export type SignInOutcome = 'dashboard' | 'resume_sign_up';

export function isSignInFailure(reason: string): reason is PharmacySignInFailure | 'passcode_required' {
  return ['email_not_found', 'not_staff', 'wrong_password', 'wrong_passcode', 'locked', 'passcode_required'].includes(reason);
}

export async function signIn(rawEmail: string, password: string, passcode: string): Promise<ApiResult<SignInOutcome>> {
  const email = normaliseEmail(rawEmail);
  if (!supabase && !passcode.replace(/\s/g, '')) return { ok: false, reason: 'passcode_required' };
  return attempt(async () => {
    const sb = client();
    const { data: pre, error: preError } = await sb.rpc('sign_in_precheck', { p_identifier: email });
    if (preError) return { ok: false, reason: OFFLINE };
    const precheck = pre as { account: 'customer' | 'staff' | 'none'; locked_seconds: number };
    if (precheck.locked_seconds > 0) return { ok: false, reason: 'locked', lockedSeconds: precheck.locked_seconds };
    if (precheck.account === 'none') return { ok: false, reason: 'email_not_found' };
    if (precheck.account === 'customer') return { ok: false, reason: 'not_staff' };

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status && error.status >= 500) return { ok: false, reason: OFFLINE };
      const { data: lock } = await sb.rpc('record_sign_in_failure', { p_identifier: email });
      const seconds = typeof lock === 'number' ? lock : 0;
      return seconds > 0 ? { ok: false, reason: 'locked', lockedSeconds: seconds } : { ok: false, reason: 'wrong_password' };
    }

    const staff = await myStaffState();
    if (!staff) {
      await sb.auth.signOut();
      return { ok: false, reason: 'not_staff' };
    }
    if (staff.application_status === 'draft' && !staff.has_passcode) {
      await sb.rpc('clear_sign_in_failures');
      return { ok: true, value: 'resume_sign_up' };
    }
    const code = passcode.replace(/\s/g, '');
    if (!code) {
      await sb.auth.signOut();
      return { ok: false, reason: 'passcode_required' };
    }
    const { data: staffId, error: unlockError } = await sb.rpc('unlock_staff', { p_pharmacy_id: staff.pharmacy_id, p_passcode: code });
    if (unlockError || !staffId) {
      await sb.auth.signOut();
      if (unlockError && /Too many/i.test(unlockError.message)) {
        return { ok: false, reason: 'locked', lockedSeconds: Math.max(staff.passcode_locked_seconds, 60) };
      }
      return { ok: false, reason: 'wrong_passcode' };
    }
    await sb.rpc('clear_sign_in_failures');
    return { ok: true, value: 'dashboard' };
  }, 'dashboard');
}

// ---------- forgot password (email code) ----------

export async function sendResetCode(email: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().auth.resetPasswordForEmail(normaliseEmail(email));
    // Unknown emails still move on to "Check your email" so the page doesn't reveal accounts.
    if (error && error.status && error.status >= 500) return { ok: false, reason: OFFLINE };
    return { ok: true, value: undefined };
  });
}

export async function verifyResetCode(email: string, token: string): Promise<ApiResult<string>> {
  return attempt(async () => {
    const sb = client();
    const { error } = await sb.auth.verifyOtp({ email: normaliseEmail(email), token, type: 'recovery' });
    if (error) return { ok: false, reason: /token|otp|code|expired|invalid/i.test(error.message) ? 'bad_code' : OFFLINE };
    const staff = await myStaffState();
    return { ok: true, value: staff?.pharmacy_name ?? 'MedFind' };
  }, 'Fuasi Pharmacy');
}

export async function saveNewPassword(password: string): Promise<ApiResult> {
  return attempt(async () => {
    const sb = client();
    const { error } = await sb.auth.updateUser({ password });
    if (error) return { ok: false, reason: /different|same/i.test(error.message) ? 'same_password' : OFFLINE };
    await sb.auth.signOut({ scope: 'others' });
    await sb.auth.signOut({ scope: 'local' });
    return { ok: true, value: undefined };
  });
}
