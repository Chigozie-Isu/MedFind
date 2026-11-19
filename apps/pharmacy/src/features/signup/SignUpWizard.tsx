'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  cityLabel,
  currentSignupStep,
  documentsComplete,
  hasErrors,
  maskedAccount,
  normaliseNigerianPhone,
  PCN_IN_USE_MESSAGE,
  PHARMACY_CITIES,
  PHARMACY_EMAIL_IN_USE_MESSAGE,
  requiredDocumentsUploaded,
  REQUIRED_DOCUMENT_COUNT,
  validatePharmacyDetails,
  type FieldErrors,
  type PharmacyDetailsField,
  type PharmacyDetailsInput,
  type PharmacySignupStep,
} from '@medfind/core';
import { useToast } from '../auth/parts';
import {
  createOwnerAccount,
  emailInUse,
  loadApplication,
  saveDetails,
  signedInEmail,
  submitApplication,
  type Application,
  type Bank,
} from './api';
import { SignupPage, type RailStep } from './Shell';
import { StepDetails } from './StepDetails';
import { StepDocuments, type UploadState } from './StepDocuments';
import { StepPayout, type PayoutState } from './StepPayout';
import { StepReview, Submitted } from './StepReview';

export type WizardStep = PharmacySignupStep | 'submitted';

export const EMPTY_DETAILS: PharmacyDetailsInput = {
  pharmacyName: '',
  phone: '',
  street: '',
  area: '',
  cityState: '',
  landmark: '',
  pin: null,
  superintendentName: '',
  pcnNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: false,
};

export interface WizardState {
  step: WizardStep;
  details: PharmacyDetailsInput;
  errors: FieldErrors<PharmacyDetailsField>;
  app: Application | null;
  email: string | null;
  saving: boolean;
  passcode: string | null;
  /** Came to this step from Review's Edit: Continue goes back to Review. */
  editing: boolean;
}

const COPY: Record<WizardStep, { title: string; subtitle: string }> = {
  details: {
    title: 'Create your pharmacy account',
    subtitle: 'Tell us about your pharmacy and the pharmacist in charge. Patients see your name, address and hours.',
  },
  documents: {
    title: 'License and documents',
    subtitle: 'We check these to keep MedFind safe for patients. Most pharmacies are approved within 24 hours.',
  },
  payout: {
    title: 'Payment details',
    subtitle: 'Tell us where to send your money. We check the account name matches your business.',
  },
  review: { title: 'Review and submit', subtitle: 'Check everything is right. You can still edit any section before you submit.' },
  submitted: { title: 'Application submitted', subtitle: 'We’re checking your licence and documents. Most pharmacies are approved within 24 hours.' },
};

function detailsFromApp(app: Application, email: string): PharmacyDetailsInput {
  const p = app.pharmacy;
  const city = PHARMACY_CITIES.find((c) => c.city === p.city);
  return {
    ...EMPTY_DETAILS,
    pharmacyName: p.name,
    phone: p.phone,
    street: p.street,
    area: p.area,
    cityState: city ? cityLabel(city) : '',
    landmark: p.landmark ?? '',
    pin: { lat: p.lat, lng: p.lng },
    superintendentName: p.superintendent_name,
    pcnNumber: p.pcn_number,
    email,
  };
}

/** "09-11-2026" */
function shortDate(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

/** Bank short name for the rail: "Guaranty Trust Bank" → "GTBank". */
function bankShort(name: string): string {
  if (/guaranty/i.test(name)) return 'GTBank';
  if (/united bank for africa/i.test(name)) return 'UBA';
  if (/first bank/i.test(name)) return 'First Bank';
  return name.replace(/\s+(Bank|Plc|PLC|MFB)$/i, '');
}

export function railFor(st: WizardState): RailStep[] {
  const app = st.app;
  const uploaded = app?.documents.map((d) => d.kind) ?? [];
  const progress = {
    detailsDone: !!app,
    documentsUploaded: uploaded,
    payoutVerified: !!app?.payout?.verified,
    submitted: st.step === 'submitted' || (app ? app.pharmacy.application_status !== 'draft' : false),
  };
  const statusOf = (key: PharmacySignupStep, done: boolean): RailStep['status'] =>
    st.step === key ? 'current' : done ? 'done' : 'pending';
  const n = requiredDocumentsUploaded(uploaded);
  return [
    {
      key: 'details',
      status: statusOf('details', progress.detailsDone),
      detail: progress.detailsDone && st.step !== 'details' ? `${app!.pharmacy.name}, ${app!.pharmacy.area.replace(/\s+Phase.*$/i, '')}` : st.step === 'details' ? (hasErrors(validatePharmacyDetails(st.details, !st.email)) ? 'In progress' : 'All details added') : 'Your pharmacy and pin',
    },
    {
      key: 'documents',
      status: statusOf('documents', documentsComplete(uploaded)),
      detail:
        documentsComplete(uploaded) && st.step !== 'documents'
          ? `${n} of ${REQUIRED_DOCUMENT_COUNT} documents uploaded`
          : st.step === 'documents'
            ? `In progress. ${n} of ${REQUIRED_DOCUMENT_COUNT} uploaded`
            : `${REQUIRED_DOCUMENT_COUNT} documents to upload`,
    },
    {
      key: 'payout',
      status: statusOf('payout', progress.payoutVerified),
      detail:
        progress.payoutVerified && st.step !== 'payout'
          ? maskedAccount(bankShort(app!.payout!.bank_name), app!.payout!.account_number)
          : st.step === 'payout'
            ? 'Where we send your money'
            : 'What and how we pay you',
    },
    {
      key: 'review',
      status: progress.submitted ? 'done' : statusOf('review', false),
      detail: progress.submitted
        ? `Submitted on ${shortDate(app?.pharmacy.submitted_at)}`
        : st.step === 'review'
          ? 'Check your details, then submit'
          : 'Usually approved in 24 hours',
    },
  ];
}

/**
 * Pharmacy sign up: the 4 steps and "Application submitted". Resumes where the owner left off
 * (currentSignupStep). `initial` + `demo` let the dev gallery show each Figma state.
 */
export function SignUpWizard({
  initial,
  demo,
  demoUploads,
  demoPayout,
  demoBanks,
  onSubmitted,
  onDashboard,
}: {
  initial?: Partial<WizardState>;
  demo?: boolean;
  demoUploads?: Partial<Record<'premises_licence' | 'superintendent_licence' | 'cac_certificate', UploadState>>;
  demoPayout?: Partial<PayoutState>;
  demoBanks?: Bank[];
  onSubmitted?: (passcode: string) => void;
  onDashboard: () => void;
}) {
  const [st, setSt] = useState<WizardState>({
    step: 'details',
    details: EMPTY_DETAILS,
    errors: {},
    app: null,
    email: null,
    saving: false,
    passcode: null,
    editing: false,
    ...initial,
  });
  const [ready, setReady] = useState(!!demo);
  const [toast, showToast] = useToast();
  const patch = useCallback((p: Partial<WizardState>) => setSt((prev) => ({ ...prev, ...p })), []);

  const reload = useCallback(async () => {
    const app = await loadApplication();
    patch({ app });
    return app;
  }, [patch]);

  useEffect(() => {
    if (demo) return;
    (async () => {
      const email = await signedInEmail();
      if (!email) return setReady(true);
      const app = await loadApplication();
      if (!app) {
        patch({ email, details: { ...EMPTY_DETAILS, email } });
        return setReady(true);
      }
      const submitted = app.pharmacy.application_status !== 'draft';
      const step: WizardStep = submitted
        ? 'submitted'
        : currentSignupStep({
            detailsDone: true,
            documentsUploaded: app.documents.map((d) => d.kind),
            payoutVerified: !!app.payout?.verified,
            submitted: false,
          });
      patch({ email, app, details: detailsFromApp(app, email), step });
      setReady(true);
    })();
  }, [demo, patch]);

  const go = (step: WizardStep) => {
    patch({ step, editing: false });
    window.scrollTo({ top: 0 });
  };
  const afterStep = (next: WizardStep) => go(st.editing ? 'review' : next);

  const changeDetails = useCallback(
    (p: Partial<PharmacyDetailsInput>) =>
      setSt((prev) => {
        const errors = { ...prev.errors };
        for (const k of Object.keys(p)) delete errors[k as PharmacyDetailsField];
        return { ...prev, details: { ...prev.details, ...p }, errors };
      }),
    [],
  );

  const saveStep1 = async () => {
    const d = st.details;
    const errors = validatePharmacyDetails(d, !st.email);
    if (hasErrors(errors)) return patch({ errors });
    if (demo) return;
    patch({ saving: true });
    let email = st.email;
    if (!email) {
      const inUse = await emailInUse(d.email);
      if (!inUse.ok) {
        patch({ saving: false });
        return showToast(inUse.reason);
      }
      if (inUse.value) return patch({ saving: false, errors: { email: PHARMACY_EMAIL_IN_USE_MESSAGE } });
      const created = await createOwnerAccount(d.email, d.password, d.superintendentName);
      if (!created.ok) {
        patch({ saving: false });
        return created.reason === 'email_in_use' ? patch({ errors: { email: PHARMACY_EMAIL_IN_USE_MESSAGE } }) : showToast(created.reason);
      }
      email = d.email.trim().toLowerCase();
      patch({ email });
    }
    const city = PHARMACY_CITIES.find((c) => cityLabel(c) === d.cityState)!;
    const saved = await saveDetails({
      name: d.pharmacyName.trim(),
      phone: normaliseNigerianPhone(d.phone) ?? d.phone.trim(),
      street: d.street.trim(),
      area: d.area.trim(),
      city: city.city,
      state: city.state,
      landmark: d.landmark.trim(),
      lat: d.pin!.lat,
      lng: d.pin!.lng,
      superintendent_name: d.superintendentName.trim(),
      pcn_number: d.pcnNumber,
      email,
    });
    if (!saved.ok) {
      patch({ saving: false });
      return saved.reason === 'pcn_in_use' ? patch({ errors: { pcnNumber: PCN_IN_USE_MESSAGE } }) : showToast(saved.reason);
    }
    await reload();
    patch({ saving: false });
    afterStep('documents');
  };

  const submit = async () => {
    if (demo) return;
    patch({ saving: true });
    const res = await submitApplication();
    patch({ saving: false });
    if (!res.ok) return showToast(res.reason);
    await reload();
    patch({ passcode: res.value });
    onSubmitted?.(res.value);
    go('submitted');
  };

  if (!ready) return null;
  const copy = COPY[st.step];

  return (
    <SignupPage rail={railFor(st)} title={copy.title} subtitle={copy.subtitle} toast={toast}>
      {st.step === 'details' && (
        <StepDetails
          value={st.details}
          errors={st.errors}
          includeAccount={!st.email}
          submitting={st.saving}
          hideMap={demo}
          onChange={changeDetails}
          onContinue={saveStep1}
        />
      )}
      {st.step === 'documents' && (
        <StepDocuments
          pharmacyId={st.app?.pharmacy.id ?? ''}
          documents={st.app?.documents ?? []}
          initialUploads={demoUploads}
          demo={demo}
          onDocumentsChanged={reload}
          onBack={() => go('details')}
          onContinue={() => afterStep('payout')}
        />
      )}
      {st.step === 'payout' && (
        <StepPayout
          saved={st.app?.payout ?? null}
          initial={demoPayout}
          initialBanks={demoBanks}
          demo={demo}
          onVerified={reload}
          onBack={() => go('documents')}
          onContinue={() => afterStep('review')}
        />
      )}
      {st.step === 'review' && st.app && (
        <StepReview
          app={st.app}
          submitting={st.saving}
          onEdit={(step) => {
            patch({ step, editing: true });
            window.scrollTo({ top: 0 });
          }}
          onBack={() => go('payout')}
          onSubmit={submit}
        />
      )}
      {st.step === 'submitted' && <Submitted email={st.app?.pharmacy.email ?? st.email ?? ''} passcode={st.passcode} onDashboard={onDashboard} />}
    </SignupPage>
  );
}
