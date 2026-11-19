'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, type ReactElement } from 'react';
import {
  PCN_IN_USE_MESSAGE,
  PHARMACY_EMAIL_IN_USE_MESSAGE,
  pharmacySignInFailureErrors,
  validatePharmacyDetails,
  validatePharmacySignIn,
  wrongCodeMessage,
  type PharmacyDetailsInput,
} from '@medfind/core';
import { Text } from '@medfind/ui/web';
import { ForgotFlow } from '../../../features/auth/ForgotFlow';
import { SignInFlow } from '../../../features/auth/SignInFlow';
import { Splash } from '../../../features/auth/Splash';
import type { Application } from '../../../features/signup/api';
import { EMPTY_DETAILS, SignUpWizard, type WizardState } from '../../../features/signup/SignUpWizard';

const noop = () => {};
const filledSignIn = { email: 'yusuf@fuasipharmacy.ng', passcode: '48293', password: 'Fuasi2026pw' };
const filledDetails: PharmacyDetailsInput = {
  ...EMPTY_DETAILS,
  pharmacyName: 'Fuasi Pharmacy',
  phone: '+234 810 987 6543',
  street: 'No. 50 EVO Road',
  area: 'GRA Phase 2',
  cityState: 'Port Harcourt, Rivers State',
  landmark: 'Off Nibble restaurant',
  pin: { lat: 4.8156, lng: 7.0498 },
  superintendentName: 'Yusuf Bilal',
  pcnNumber: 'PCN 0081 4472',
  email: 'yusuf@fuasipharmacy.ng',
  password: 'Fuasi2026',
  confirmPassword: 'Fuasi2026',
  agreedToTerms: true,
};
const pharmacy: Application['pharmacy'] = {
  id: '00000000-0000-4000-8000-000000000000',
  name: 'Fuasi Pharmacy',
  phone: '+2348109876543',
  street: 'No. 50 EVO Road',
  area: 'GRA Phase 2',
  city: 'Port Harcourt',
  state: 'Rivers State',
  landmark: 'Off Nibble restaurant',
  superintendent_name: 'Yusuf Bilal',
  pcn_number: '00814472',
  email: 'yusuf@fuasipharmacy.ng',
  lat: 4.8156,
  lng: 7.0498,
  application_status: 'draft',
  submitted_at: null,
};
const doc = (kind: 'premises_licence' | 'superintendent_licence' | 'cac_certificate', file: string) => ({
  id: kind, kind, file_name: file, size_bytes: 1_250_000, storage_path: `x/${kind}/${file}`,
});
const allDocs = [doc('premises_licence', 'pcn-premises-licence.pdf'), doc('superintendent_licence', 'annual-licence-2026.pdf'), doc('cac_certificate', 'cac-certificate.pdf')];
const payout = { bank_name: 'Guaranty Trust Bank', bank_code: '058', account_number: '0123456789', account_name: 'FUASI PHARMACY LTD', verified: true };
const banks = [{ name: 'Access Bank', code: '044' }, { name: 'Guaranty Trust Bank', code: '058' }, { name: 'Zenith Bank', code: '057' }];

const wizard = (initial: Partial<WizardState>, extra: Partial<Parameters<typeof SignUpWizard>[0]> = {}) => (
  <SignUpWizard demo initial={initial} demoBanks={banks} onDashboard={noop} {...extra} />
);
const step1 = (details: PharmacyDetailsInput, errors = validatePharmacyDetails(details), saving = false) =>
  wizard({ step: 'details', details, errors, saving });
const signIn = (initial: Parameters<typeof SignInFlow>[0]['initial']) => <SignInFlow demo initial={initial} onSignedIn={noop} onForgotPassword={noop} />;

/** Every Figma state in the pharmacy Start, Sign in and forgot password, and Sign up sections. */
const PREVIEWS: Record<string, () => ReactElement> = {
  splash: () => <Splash onSignIn={noop} onCreateAccount={noop} />,
  'signin-empty': () => signIn({}),
  'signin-filled': () => signIn(filledSignIn),
  'signin-required': () => signIn({ errors: validatePharmacySignIn({ email: '', passcode: '', password: '' }) }),
  'signin-invalid-email': () => signIn({ ...filledSignIn, email: 'yusuf@fuasipharmacy', errors: validatePharmacySignIn({ ...filledSignIn, email: 'yusuf@fuasipharmacy' }) }),
  'signin-email-not-found': () => signIn({ ...filledSignIn, errors: pharmacySignInFailureErrors('email_not_found') }),
  'signin-wrong-passcode': () => signIn({ ...filledSignIn, errors: pharmacySignInFailureErrors('wrong_passcode') }),
  'signin-wrong-password': () => signIn({ ...filledSignIn, errors: pharmacySignInFailureErrors('wrong_password') }),
  'signin-both-wrong': () => signIn({ ...filledSignIn, errors: pharmacySignInFailureErrors('not_staff') }),
  'signin-loading': () => signIn({ ...filledSignIn, loading: true }),
  'signin-locked': () => signIn({ ...filledSignIn, lockedSeconds: 299, errors: pharmacySignInFailureErrors('locked', 299) }),
  'forgot-email': () => <ForgotFlow demo initial={{ email: 'yusuf@fuasipharmacy.ng' }} onSignIn={noop} />,
  'forgot-code': () => <ForgotFlow demo initial={{ step: 'code', email: 'yusuf@fuasipharmacy.ng', code: '482931' }} onSignIn={noop} />,
  'forgot-wrong-code': () => (
    <ForgotFlow demo initial={{ step: 'code', email: 'yusuf@fuasipharmacy.ng', code: '000000', triesUsed: 1, codeError: wrongCodeMessage(1) }} onSignIn={noop} />
  ),
  'forgot-new': () => <ForgotFlow demo initial={{ step: 'new', password: 'Fuasi2026!', confirm: 'Fuasi2026!' }} onSignIn={noop} />,
  'forgot-done': () => <ForgotFlow demo initial={{ step: 'done', pharmacyName: 'Fuasi Pharmacy' }} onSignIn={noop} />,
  'signup1-empty': () => step1(EMPTY_DETAILS, {}),
  'signup1-filled': () => step1(filledDetails, {}),
  'signup1-required': () => step1(EMPTY_DETAILS),
  'signup1-invalid': () => step1({ ...filledDetails, phone: '0810 987', email: 'yusuf@fuasipharmacy' }),
  'signup1-registered': () => step1(filledDetails, { email: PHARMACY_EMAIL_IN_USE_MESSAGE, pcnNumber: PCN_IN_USE_MESSAGE }),
  'signup1-password': () => step1({ ...filledDetails, password: 'fuasi', confirmPassword: 'fuasi2' }),
  'signup1-pin': () => step1({ ...filledDetails, pin: null }),
  'signup1-submitting': () => step1(filledDetails, {}, true),
  'signup2-none': () => wizard({ step: 'documents', app: { pharmacy, documents: [], payout: null }, email: pharmacy.email }),
  'signup2-one': () => wizard({ step: 'documents', app: { pharmacy, documents: allDocs.slice(0, 1), payout: null }, email: pharmacy.email }),
  'signup2-uploading': () =>
    wizard(
      { step: 'documents', app: { pharmacy, documents: allDocs.slice(0, 1), payout: null }, email: pharmacy.email },
      { demoUploads: { superintendent_licence: { fileName: 'annual-licence-2026.pdf', sizeBytes: 1_250_000, progress: 0.6 } } },
    ),
  'signup2-error': () =>
    wizard(
      { step: 'documents', app: { pharmacy, documents: allDocs.slice(0, 1), payout: null }, email: pharmacy.email },
      { demoUploads: { superintendent_licence: { fileName: 'licence-scan.tiff', sizeBytes: 21_700_000, progress: 0, error: 'This file is 20.7 MB. Upload a PDF, JPG or PNG under 10 MB.' } } },
    ),
  'signup2-done': () => wizard({ step: 'documents', app: { pharmacy, documents: allDocs, payout: null }, email: pharmacy.email }),
  'signup3-empty': () => wizard({ step: 'payout', app: { pharmacy, documents: allDocs, payout: null }, email: pharmacy.email }),
  'signup3-verified': () => wizard({ step: 'payout', app: { pharmacy, documents: allDocs, payout }, email: pharmacy.email }),
  'signup3-mismatch': () =>
    wizard(
      { step: 'payout', app: { pharmacy, documents: allDocs, payout: null }, email: pharmacy.email },
      { demoPayout: { bankCode: '058', accountNumber: '0123456789', check: { kind: 'mismatch', accountName: 'GRACE OKAFOR', businessName: 'Fuasi Pharmacy Ltd' } } },
    ),
  'signup4-review': () => wizard({ step: 'review', app: { pharmacy, documents: allDocs, payout }, email: pharmacy.email }),
  'signup-submitted': () =>
    wizard({
      step: 'submitted',
      app: { pharmacy: { ...pharmacy, application_status: 'submitted', submitted_at: '2026-11-09T10:00:00Z' }, documents: allDocs, payout },
      email: pharmacy.email,
      passcode: '48293',
    }),
};

function Gallery() {
  const state = useSearchParams().get('state');
  const render = state ? PREVIEWS[state] : undefined;
  if (render) return render();
  return (
    <main style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text variant="h2" as="h1">
        Pharmacy sign in and sign up
      </Text>
      <Text variant="body2" color="var(--mf-text-secondary)">
        Each Figma state, without calling Supabase.
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(PREVIEWS).map((k) => (
          <a key={k} href={`?state=${k}`} className="mf-t-button2" style={{ color: 'var(--mf-text-brand)', padding: 8 }}>
            {k}
          </a>
        ))}
      </div>
    </main>
  );
}

export default function DevAuthPage() {
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}
