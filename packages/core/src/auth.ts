/**
 * Sign-up, log-in and forgot-password rules for both apps. Error messages are the exact copy
 * from the Figma error states, so both apps show the same words. The database enforces the
 * lockout numbers too (private.rule_sign_in_* in supabase/migrations), and
 * test/rules-sync.test.ts fails if they drift apart.
 */

/** One-time codes (phone verification, email codes, password reset) are 6 digits. */
export const OTP_LENGTH = 6;
/** A code works for 10 minutes. */
export const OTP_VALID_MINUTES = 10;
/** "Resend in 00:45": a new code can be asked for after 45 seconds. */
export const OTP_RESEND_SECONDS = 45;
/** "You have 2 tries left": 3 tries per code, then the customer asks for a new one. */
export const OTP_MAX_TRIES = 3;
/** Wrong passwords allowed before sign-in locks. */
export const SIGN_IN_MAX_ATTEMPTS = 5;
/** "Try again in 04:59": sign-in locks for 5 minutes. */
export const SIGN_IN_LOCK_MINUTES = 5;
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Lower-cased and trimmed, as stored by Supabase Auth. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A Nigerian mobile number in E.164 (+2348030002291), or null if it isn't one.
 * Accepts 0803 000 2291, 803 000 2291, 234 803..., +234 803...
 */
export function normaliseNigerianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let national: string;
  if (digits.startsWith('234') && digits.length === 13) national = digits.slice(3);
  else if (digits.startsWith('0') && digits.length === 11) national = digits.slice(1);
  else if (digits.length === 10 && !digits.startsWith('0')) national = digits;
  else return null;
  return /^[789][01]\d{8}$/.test(national) ? `+234${national}` : null;
}

/** +234 803 000 2291 */
export function formatPhoneInternational(e164: string): string {
  const n = e164.replace(/^\+234/, '');
  return `+234 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** grace****@gmail.com: the first five letters (fewer for short names), then stars. */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const keep = Math.max(1, Math.min(5, name.length - 1));
  return `${name.slice(0, keep)}****@${domain}`;
}

/** +234 803 *** 2291 */
export function maskPhone(e164: string): string {
  const n = e164.replace(/^\+234/, '');
  return `+234 ${n.slice(0, 3)} *** ${n.slice(6)}`;
}

/** 299 -> "04:59" */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds left until `until`, never negative. */
export function secondsUntil(until: Date | string | null | undefined, now: Date = new Date()): number {
  if (!until) return 0;
  const t = typeof until === 'string' ? Date.parse(until) : until.getTime();
  return Math.max(0, Math.ceil((t - now.getTime()) / 1000));
}

export interface PasswordChecks {
  minLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function passwordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9\s]/.test(password),
  };
}

/** Sign up (both apps): at least 8 characters with a number. */
export function isStrongEnoughForSignUp(password: string): boolean {
  const c = passwordChecks(password);
  return c.minLength && c.hasNumber;
}

/** New password after a reset (both apps): at least 8 characters, a number and a symbol. */
export function isStrongEnoughForReset(password: string): boolean {
  const c = passwordChecks(password);
  return c.minLength && c.hasNumber && c.hasSymbol;
}

export const PASSWORD_RESET_CHECK_LABELS: Record<keyof PasswordChecks, string> = {
  minLength: 'At least 8 characters',
  hasNumber: 'At least one number',
  hasSymbol: 'At least one symbol, like ! or #',
};

export const WEAK_PASSWORD_MESSAGE = 'Too short. Use at least 8 characters, with a number.';
export const PASSWORD_HINT = 'At least 8 characters, with a number';

/** Field name -> error message. A field with no entry is fine. */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}

// ---------- customer: log in ----------

export type LoginIdentifier = { kind: 'email'; value: string } | { kind: 'phone'; value: string };

/** What the customer typed in "Email or phone number". */
export function parseLoginIdentifier(raw: string): LoginIdentifier | null {
  const t = raw.trim();
  if (t.includes('@')) return isValidEmail(t) ? { kind: 'email', value: normaliseEmail(t) } : null;
  const phone = normaliseNigerianPhone(t);
  return phone ? { kind: 'phone', value: phone } : null;
}

export function validateCustomerLogin(input: { identifier: string; password: string }): FieldErrors<'identifier' | 'password'> {
  const errors: FieldErrors<'identifier' | 'password'> = {};
  const id = input.identifier.trim();
  if (!id) errors.identifier = 'Enter your email or phone number';
  else if (!parseLoginIdentifier(id)) errors.identifier = id.includes('@') ? 'Enter a valid email' : 'Check your email or phone number';
  if (!input.password) errors.password = 'Enter your password';
  return errors;
}

/** What went wrong after the server checked the details (Log in error frames). */
export type CustomerLoginFailure = 'email_not_found' | 'phone_not_found' | 'wrong_password' | 'locked';

export function customerLoginFailureErrors(
  failure: CustomerLoginFailure,
  lockedSeconds = 0,
): FieldErrors<'identifier' | 'password'> {
  switch (failure) {
    case 'email_not_found':
      return { identifier: 'No account uses this email. Check it or sign up.' };
    case 'phone_not_found':
      return { identifier: 'Check your email or phone number', password: 'Email or password is wrong. Check both and try again.' };
    case 'wrong_password':
      return { password: 'Wrong password. Try again or tap Forgot password.' };
    case 'locked':
      return { password: `Too many wrong tries. Try again in ${formatCountdown(lockedSeconds)} mins` };
  }
}

// ---------- customer: sign up ----------

export type CustomerSignUpField = 'email' | 'phone' | 'password';

export function validateCustomerSignUp(input: { email: string; phone: string; password: string }): FieldErrors<CustomerSignUpField> {
  const errors: FieldErrors<CustomerSignUpField> = {};
  if (!input.email.trim()) errors.email = 'Enter your email';
  else if (!isValidEmail(input.email)) errors.email = 'Enter a full email, like name@example.com';
  if (!input.phone.trim()) errors.phone = 'Enter your phone number';
  else if (!normaliseNigerianPhone(input.phone)) errors.phone = 'Enter all 11 digits, like 0803 123 4567';
  if (!input.password) errors.password = 'Create a password';
  else if (!isStrongEnoughForSignUp(input.password)) errors.password = WEAK_PASSWORD_MESSAGE;
  return errors;
}

export const EMAIL_IN_USE_MESSAGE = 'This email already has an account. Sign in instead.';
export const PHONE_IN_USE_MESSAGE = 'This number already has an account. Sign in instead.';

// ---------- codes ----------

/** "That code isn't right. You have 2 tries left." */
export function wrongCodeMessage(triesUsed: number): string {
  const left = Math.max(0, OTP_MAX_TRIES - triesUsed);
  if (left === 0) return 'That code isn’t right. Ask for a new code.';
  return `That code isn’t right. You have ${left} ${left === 1 ? 'try' : 'tries'} left.`;
}

export function isCompleteCode(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);
}

// ---------- forgot password ----------

export function validateForgotIdentifier(raw: string, app: 'customer' | 'pharmacy'): string | null {
  const t = raw.trim();
  if (app === 'pharmacy') {
    if (!t) return 'Enter your work email';
    return isValidEmail(t) ? null : 'Enter a full email, like name@pharmacy.ng';
  }
  if (!t) return 'Enter your email or phone number';
  if (!parseLoginIdentifier(t)) return t.includes('@') ? 'Enter a valid email' : 'Check your email or phone number';
  return null;
}

export function validateNewPassword(input: { password: string; confirm: string }): FieldErrors<'password' | 'confirm'> {
  const errors: FieldErrors<'password' | 'confirm'> = {};
  if (!input.password) errors.password = 'Enter a new password';
  else if (!isStrongEnoughForReset(input.password)) errors.password = 'Use at least 8 characters, with a number and a symbol.';
  if (!input.confirm) errors.confirm = 'Type the password again';
  else if (input.password && input.confirm !== input.password) errors.confirm = 'Passwords don’t match';
  return errors;
}

// ---------- pharmacy: sign in ----------

export type PharmacySignInField = 'email' | 'passcode' | 'password';

export function validatePharmacySignIn(input: { email: string; passcode: string; password: string }): FieldErrors<PharmacySignInField> {
  const errors: FieldErrors<PharmacySignInField> = {};
  if (!input.email.trim()) errors.email = 'Enter your work email';
  else if (!isValidEmail(input.email)) errors.email = 'Enter a full email, like name@pharmacy.ng';
  if (!input.passcode.trim()) errors.passcode = 'Enter your staff passcode';
  else if (!/^\d{5}$/.test(input.passcode.replace(/\s/g, ''))) errors.passcode = 'This passcode doesn’t match. Ask your manager for your code.';
  if (!input.password) errors.password = 'Enter your password';
  return errors;
}

export type PharmacySignInFailure = 'email_not_found' | 'not_staff' | 'wrong_password' | 'wrong_passcode' | 'locked';

export function pharmacySignInFailureErrors(failure: PharmacySignInFailure, lockedSeconds = 0): FieldErrors<PharmacySignInField> {
  switch (failure) {
    case 'email_not_found':
      return { email: 'No account uses this email. Check it or create an account.' };
    case 'not_staff':
      return { email: 'Check your email', password: 'Email or password is wrong. Check both and try again.' };
    case 'wrong_password':
      return { password: 'Wrong password. Try again or tap Forgot password.' };
    case 'wrong_passcode':
      return { passcode: 'This passcode doesn’t match. Ask your manager for your code.' };
    case 'locked':
      return { password: `Too many wrong tries. Try again in ${formatCountdown(lockedSeconds)} or reset your password.` };
  }
}
