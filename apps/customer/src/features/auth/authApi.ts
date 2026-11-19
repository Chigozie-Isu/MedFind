/**
 * Supabase Auth calls for the customer Log in, Sign up, Verify phone and Forgot password
 * screens. Each returns a small result the screens turn into Figma's messages
 * (the messages themselves live in @medfind/core).
 *
 * Codes: phone verification uses Supabase's phone-change SMS code; "Send code to email
 * instead" and forgot password by email use a 6-digit email code; forgot password by phone
 * uses an SMS sign-in code. All codes last 10 minutes (supabase/config.toml).
 */
import { parseLoginIdentifier, type LoginIdentifier } from '@medfind/core';
import { supabase } from '../../lib/supabase';

export type ApiResult<T = void> = { ok: true; value: T } | { ok: false; reason: string; lockedSeconds?: number };

const NOT_SET_UP = 'MedFind isn’t connected yet. Add the Supabase settings in apps/customer/.env.local.';
const OFFLINE = 'We couldn’t reach MedFind. Check your connection and try again.';

function client() {
  if (!supabase) throw new Error(NOT_SET_UP);
  return supabase;
}

async function attempt<T>(fn: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return { ok: false, reason: e instanceof Error && e.message === NOT_SET_UP ? NOT_SET_UP : OFFLINE };
  }
}

/** Wrong code, expired code and similar all come back from Supabase as one of these. */
function isBadCode(message: string): boolean {
  return /token|otp|code|expired|invalid/i.test(message);
}

// ---------- log in ----------

export type LogInFailure = 'email_not_found' | 'phone_not_found' | 'wrong_password' | 'locked';

export function isLogInFailure(reason: string): reason is LogInFailure {
  return ['email_not_found', 'phone_not_found', 'wrong_password', 'locked'].includes(reason);
}

/**
 * Checks the lock and the account first (sign_in_precheck), then the password. A wrong
 * password counts towards the 5-try lock (record_sign_in_failure); success clears it.
 * On failure `reason` is a LogInFailure, or a message to show as a toast.
 */
export async function logIn(rawIdentifier: string, password: string): Promise<ApiResult> {
  const id = parseLoginIdentifier(rawIdentifier);
  if (!id) return { ok: false, reason: 'phone_not_found' };
  return attempt(async () => {
    const sb = client();
    const { data: pre, error: preError } = await sb.rpc('sign_in_precheck', { p_identifier: id.value });
    if (preError) return { ok: false, reason: OFFLINE };
    const precheck = pre as { account: 'customer' | 'staff' | 'none'; locked_seconds: number };
    if (precheck.locked_seconds > 0) return { ok: false, reason: 'locked', lockedSeconds: precheck.locked_seconds };
    if (precheck.account !== 'customer') {
      return { ok: false, reason: id.kind === 'email' ? 'email_not_found' : 'phone_not_found' };
    }
    const { error } = await sb.auth.signInWithPassword(
      id.kind === 'email' ? { email: id.value, password } : { phone: id.value, password },
    );
    if (error) {
      if (error.status && error.status >= 500) return { ok: false, reason: OFFLINE };
      const { data: lock } = await sb.rpc('record_sign_in_failure', { p_identifier: id.value });
      const seconds = typeof lock === 'number' ? lock : 0;
      return seconds > 0 ? { ok: false, reason: 'locked', lockedSeconds: seconds } : { ok: false, reason: 'wrong_password' };
    }
    await sb.rpc('clear_sign_in_failures');
    return { ok: true, value: undefined };
  });
}

// ---------- sign up ----------

export interface SignUpCheck {
  emailInUse: boolean;
  phoneInUse: boolean;
}

export async function checkSignUp(email: string, phone: string): Promise<ApiResult<SignUpCheck>> {
  return attempt(async () => {
    const { data, error } = await client().rpc('sign_up_precheck', { p_email: email, p_phone: phone });
    if (error) return { ok: false, reason: OFFLINE };
    const d = data as { email_in_use: boolean; phone_in_use: boolean };
    return { ok: true, value: { emailInUse: d.email_in_use, phoneInUse: d.phone_in_use } };
  });
}

/**
 * Creates the account (or reuses it when the person came back with Edit) and texts a code
 * to the phone number. The customer row is made by the database from the sign-up details.
 */
export async function signUpAndSendCode(email: string, phone: string, password: string): Promise<ApiResult> {
  return attempt(async () => {
    const sb = client();
    const { data: current } = await sb.auth.getUser();
    if (!current.user || current.user.email !== email) {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { phone, account_type: 'customer' } } });
      if (error) return { ok: false, reason: /registered|exists/i.test(error.message) ? 'email_in_use' : OFFLINE };
    }
    return sendPhoneCode(phone);
  });
}

export async function sendPhoneCode(phone: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().auth.updateUser({ phone });
    if (error) return { ok: false, reason: /already|registered/i.test(error.message) ? 'phone_in_use' : OFFLINE };
    return { ok: true, value: undefined };
  });
}

export async function verifyPhoneCode(phone: string, token: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().auth.verifyOtp({ phone, token, type: 'phone_change' });
    if (error) return { ok: false, reason: isBadCode(error.message) ? 'bad_code' : OFFLINE };
    return { ok: true, value: undefined };
  });
}

/** The signed-up email, for "Send code to email instead". */
export async function signedUpEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function sendEmailCode(email: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return { ok: false, reason: OFFLINE };
    return { ok: true, value: undefined };
  });
}

export async function verifyEmailCode(email: string, token: string): Promise<ApiResult> {
  return attempt(async () => {
    const { error } = await client().auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { ok: false, reason: isBadCode(error.message) ? 'bad_code' : OFFLINE };
    return { ok: true, value: undefined };
  });
}

// ---------- forgot password ----------

export async function sendResetCode(id: LoginIdentifier): Promise<ApiResult> {
  return attempt(async () => {
    const sb = client();
    const { error } =
      id.kind === 'email'
        ? await sb.auth.resetPasswordForEmail(id.value)
        : await sb.auth.signInWithOtp({ phone: id.value, options: { shouldCreateUser: false } });
    // An unknown email or phone still moves on to "Enter the code", so the screen doesn't
    // tell strangers which accounts exist.
    if (error && error.status && error.status >= 500) return { ok: false, reason: OFFLINE };
    return { ok: true, value: undefined };
  });
}

export async function verifyResetCode(id: LoginIdentifier, token: string): Promise<ApiResult> {
  return attempt(async () => {
    const sb = client();
    const { error } =
      id.kind === 'email'
        ? await sb.auth.verifyOtp({ email: id.value, token, type: 'recovery' })
        : await sb.auth.verifyOtp({ phone: id.value, token, type: 'sms' });
    if (error) return { ok: false, reason: isBadCode(error.message) ? 'bad_code' : OFFLINE };
    return { ok: true, value: undefined };
  });
}

/** Saves the new password, signs out every other device, then this one. */
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
