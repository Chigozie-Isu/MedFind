/**
 * Pharmacy sign-up rules: the 4 steps (details and map pin, licence documents, payout
 * account, review), which documents are needed, file limits, the payout account-name
 * check, and the application status. Error messages are the Figma copy.
 */
import { isStrongEnoughForSignUp, isValidEmail, normaliseNigerianPhone, WEAK_PASSWORD_MESSAGE, type FieldErrors } from './auth.ts';

export const PHARMACY_SIGNUP_STEPS = [
  { key: 'details', title: 'Pharmacy details' },
  { key: 'documents', title: 'License and documents' },
  { key: 'payout', title: 'Payment details' },
  { key: 'review', title: 'Review and submit' },
] as const;
export type PharmacySignupStep = (typeof PHARMACY_SIGNUP_STEPS)[number]['key'];

/** Where an application is. Only approved pharmacies can go live and take reservations. */
export const PHARMACY_APPLICATION_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;
export type PharmacyApplicationStatus = (typeof PHARMACY_APPLICATION_STATUSES)[number];

export function canGoLive(status: PharmacyApplicationStatus): boolean {
  return status === 'approved';
}

/** Cities offered in "City and state". Sign up opens in these cities first. */
export const PHARMACY_CITIES = [
  { city: 'Lagos', state: 'Lagos State' },
  { city: 'Abuja', state: 'FCT' },
  { city: 'Port Harcourt', state: 'Rivers State' },
  { city: 'Ibadan', state: 'Oyo State' },
  { city: 'Kano', state: 'Kano State' },
  { city: 'Benin City', state: 'Edo State' },
  { city: 'Enugu', state: 'Enugu State' },
] as const;

export function cityLabel(c: { city: string; state: string }): string {
  return `${c.city}, ${c.state}`;
}

// ---------- step 1 ----------

export interface PharmacyDetailsInput {
  pharmacyName: string;
  phone: string;
  street: string;
  area: string;
  /** "Port Harcourt, Rivers State", one of PHARMACY_CITIES. */
  cityState: string;
  landmark: string;
  /** Where the owner dropped the pin, or null if they haven't. */
  pin: { lat: number; lng: number } | null;
  superintendentName: string;
  pcnNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export type PharmacyDetailsField = Exclude<keyof PharmacyDetailsInput, 'landmark'>;

/**
 * Step 1 errors. When `includeAccount` is false (editing details after the account exists)
 * the email and password fields are skipped.
 */
export function validatePharmacyDetails(
  input: PharmacyDetailsInput,
  includeAccount = true,
): FieldErrors<PharmacyDetailsField> {
  const e: FieldErrors<PharmacyDetailsField> = {};
  if (!input.pharmacyName.trim()) e.pharmacyName = 'Enter your pharmacy name';
  if (!input.phone.trim()) e.phone = 'Enter a number patients can call';
  else if (!normaliseNigerianPhone(input.phone)) e.phone = 'Enter the full number, like +234 810 987 6543';
  if (!input.street.trim()) e.street = 'Enter the street';
  if (!input.area.trim()) e.area = 'Enter the area';
  if (!PHARMACY_CITIES.some((c) => cityLabel(c) === input.cityState)) e.cityState = 'Choose your city and state';
  if (!input.superintendentName.trim()) e.superintendentName = 'Enter the superintendent’s full name';
  if (!input.pcnNumber.trim()) e.pcnNumber = 'Enter the PCN registration number';
  if (includeAccount) {
    if (!input.email.trim()) e.email = 'Enter a work email';
    else if (!isValidEmail(input.email)) e.email = 'Enter a full email, like name@pharmacy.ng';
    if (!input.password) e.password = 'Create a password';
    else if (!isStrongEnoughForSignUp(input.password)) e.password = WEAK_PASSWORD_MESSAGE;
    if (!input.confirmPassword) e.confirmPassword = 'Type the password again';
    else if (input.password && input.confirmPassword !== input.password) e.confirmPassword = 'Passwords don’t match';
    if (!input.agreedToTerms) e.agreedToTerms = 'Agree to the MedFind Terms to continue';
  }
  if (!input.pin) {
    // Figma: with other fields missing the pin asks "before you continue"; alone it explains why.
    e.pin = Object.keys(e).length > 0
      ? 'Drag the pin to your door before you continue.'
      : 'Drag the pin to your door so patients and riders find you.';
  }
  return e;
}

export const PIN_HELP = 'Drag the pin so patients arrive at the right entrance.';
export const PCN_IN_USE_MESSAGE = 'This PCN number is already linked to a pharmacy. Chat with us if that’s wrong.';
export const PHARMACY_EMAIL_IN_USE_MESSAGE = 'This email already has a MedFind account. Sign in instead.';

/** "PCN 0081 4472" and "00814472" are the same number. */
export function normalisePcnNumber(raw: string): string {
  return raw.toUpperCase().replace(/^PCN/, '').replace(/[^0-9A-Z]/g, '');
}

// ---------- step 2 ----------

export const PHARMACY_DOCUMENTS = [
  { kind: 'premises_licence', title: 'PCN premises licence', hint: 'The current year’s licence for this address', required: true },
  { kind: 'superintendent_licence', title: 'Superintendent pharmacist’s annual licence', hint: 'The licence to practise pharmacy', required: true },
  { kind: 'cac_certificate', title: 'CAC certificate of incorporation', hint: 'Or your business name registration', required: true },
  { kind: 'shop_front', title: 'Photo of your shop front', hint: 'JPG, PNG or HEIC, up to 10 MB each. Add as many as you like.', required: false },
] as const;
export type PharmacyDocumentKind = (typeof PHARMACY_DOCUMENTS)[number]['kind'];

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const LICENCE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

export function allowedDocumentTypes(kind: PharmacyDocumentKind): readonly string[] {
  return kind === 'shop_front' ? PHOTO_TYPES : LICENCE_TYPES;
}

/** "20.7 MB", "1.2 MB", "350 KB" */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Why a file can't be used, in Figma's words, or null if it's fine. */
export function documentFileProblem(kind: PharmacyDocumentKind, file: { sizeBytes: number; mimeType: string }): string | null {
  const types = allowedDocumentTypes(kind);
  const what = kind === 'shop_front' ? 'a JPG, PNG or HEIC' : 'a PDF, JPG or PNG';
  if (file.sizeBytes > DOCUMENT_MAX_BYTES) return `This file is ${formatFileSize(file.sizeBytes)}. Upload ${what} under 10 MB.`;
  if (!types.includes(file.mimeType)) return `This file type can’t be used. Upload ${what} under 10 MB.`;
  return null;
}

export const REQUIRED_DOCUMENT_COUNT = PHARMACY_DOCUMENTS.filter((d) => d.required).length;

export function requiredDocumentsUploaded(uploaded: readonly PharmacyDocumentKind[]): number {
  return PHARMACY_DOCUMENTS.filter((d) => d.required && uploaded.includes(d.kind)).length;
}

export function documentsComplete(uploaded: readonly PharmacyDocumentKind[]): boolean {
  return requiredDocumentsUploaded(uploaded) === REQUIRED_DOCUMENT_COUNT;
}

// ---------- step 3 ----------

/** Words that don't change who owns an account. */
const NAME_NOISE = new Set(['LTD', 'LIMITED', 'NIG', 'NIGERIA', 'PLC', 'CO', 'COMPANY', 'ENTERPRISE', 'ENTERPRISES', 'VENTURE', 'VENTURES', 'AND', 'THE', 'INTL', 'INTERNATIONAL', 'GLOBAL', 'SERVICES', 'RC', 'BN']);

function nameTokens(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !NAME_NOISE.has(t));
}

/**
 * Payouts only go to an account in the pharmacy's business name. The bank's account name
 * matches when it contains every word of the pharmacy name, ignoring LTD, ENTERPRISES and
 * similar. "FUASI PHARMACY LTD" matches "Fuasi Pharmacy"; "GRACE OKAFOR" does not.
 * private.account_name_matches in the database gives the same answers (supabase/tests/auth_signup.test.sql).
 */
export function accountNameMatchesBusiness(accountName: string, businessName: string): boolean {
  const business = nameTokens(businessName);
  if (business.length === 0) return false;
  const account = new Set(nameTokens(accountName));
  return business.every((t) => account.has(t));
}

export function isValidAccountNumber(n: string): boolean {
  return /^\d{10}$/.test(n.replace(/\s/g, ''));
}

/** "0123 456 789" */
export function formatAccountNumber(n: string): string {
  const d = n.replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : d;
}

/** "GTBank •••• 6789" on the step rail. */
export function maskedAccount(bankShortName: string, accountNumber: string): string {
  return `${bankShortName} •••• ${accountNumber.slice(-4)}`;
}

// ---------- the rail ----------

export interface SignupProgress {
  detailsDone: boolean;
  documentsUploaded: readonly PharmacyDocumentKind[];
  payoutVerified: boolean;
  submitted: boolean;
}

/** The first step that still needs the owner. */
export function currentSignupStep(p: SignupProgress): PharmacySignupStep {
  if (!p.detailsDone) return 'details';
  if (!documentsComplete(p.documentsUploaded)) return 'documents';
  if (!p.payoutVerified) return 'payout';
  return 'review';
}

export function canSubmitApplication(p: SignupProgress, confirmed: boolean): boolean {
  return p.detailsDone && documentsComplete(p.documentsUploaded) && p.payoutVerified && confirmed && !p.submitted;
}
