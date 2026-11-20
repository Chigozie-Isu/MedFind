'use client';

import { LegalLink } from '../common/Legal';
import { useState } from 'react';
import { formatAccountNumber, formatPhoneInternational, PHARMACY_DOCUMENTS } from '@medfind/core';
import { sizes } from '@medfind/ui';
import { Button, Checkbox, Icon, Text } from '@medfind/ui/web';
import type { Application } from './api';
import { Notice, signupStyles as s } from './Shell';

function ReviewCard({ title, onEdit, rows }: { title: string; onEdit: () => void; rows: [string, React.ReactNode][] }) {
  return (
    <section className={s.reviewCard}>
      <div className={s.reviewHead}>
        <Text variant="h5" as="h2" color="var(--mf-text-heading)">{title}</Text>
        <Button label="Edit" variant="text" size="small" onPress={onEdit} accessibilityLabel={`Edit ${title.toLowerCase()}`} />
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className={s.reviewRow}>
          <Text variant="caption1" color="var(--mf-text-secondary)">{label}</Text>
          <span className="mf-t-body3" style={{ color: 'var(--mf-text-primary)' }}>{value}</span>
        </div>
      ))}
    </section>
  );
}

/** "PCN 0081 4472" from the stored "00814472". */
function pcnLabel(pcn: string): string {
  const d = pcn.replace(/\s/g, '');
  return /^\d{8}$/.test(d) ? `PCN ${d.slice(0, 4)} ${d.slice(4)}` : `PCN ${d}`;
}

/** Step 4 (Figma "Sign up step 4 – review"). */
export function StepReview({
  app,
  submitting,
  onEdit,
  onBack,
  onSubmit,
}: {
  app: Application;
  submitting: boolean;
  onEdit: (step: 'details' | 'documents' | 'payout') => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const p = app.pharmacy;
  const address = [p.street, p.landmark, p.area, p.city, p.state].filter(Boolean).join(', ');
  const tick = (text: string) => (
    <span className={s.ok}>
      <Icon name="tick-circle" size={sizes.icon.sm} color="var(--mf-text-success)" />
      {text}
    </span>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 12px' }}>
      <ReviewCard
        title="Pharmacy details"
        onEdit={() => onEdit('details')}
        rows={[
          ['Pharmacy name', p.name],
          ['Address', address],
          ['Phone number', p.phone.startsWith('+234') ? formatPhoneInternational(p.phone) : p.phone],
          ['Superintendent pharmacist', `${p.superintendent_name} · ${pcnLabel(p.pcn_number)}`],
        ]}
      />
      <ReviewCard
        title="License and documents"
        onEdit={() => onEdit('documents')}
        rows={PHARMACY_DOCUMENTS.filter((d) => d.required).map((d) => {
          const doc = app.documents.find((x) => x.kind === d.kind);
          return [d.title, doc ? tick(`Uploaded · ${doc.file_name}`) : 'Not uploaded'] as [string, React.ReactNode];
        })}
      />
      <ReviewCard
        title="Payment details"
        onEdit={() => onEdit('payout')}
        rows={
          app.payout
            ? [
                ['Bank', app.payout.bank_name],
                ['Account', `${app.payout.account_name} · ${formatAccountNumber(app.payout.account_number)}`],
                ['Payouts', 'Every second Friday'],
              ]
            : [['Bank', 'Not added yet']]
        }
      />
      <div className={s.terms}>
        <Checkbox checked={confirmed} onChange={setConfirmed} accessibilityLabel="I confirm these details are correct" />
        <Text variant="body3" color="var(--mf-text-heading)">
          I confirm these details are correct and agree to the <LegalLink doc="terms" label="MedFind pharmacy terms" />, including the 5% fee on reserved sales, and the{' '}
          <LegalLink doc="privacy" label="privacy policy" />.
        </Text>
      </div>
      <Notice>Submitting doesn’t make you live straight away. Our team checks everything first.</Notice>
      <div className={s.actions} style={{ padding: '8px 0 0' }}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Button label="Submit for review" loadingLabel="Submitting…" loading={submitting} disabled={!confirmed} onPress={onSubmit} />
      </div>
    </div>
  );
}

/** "Application submitted", with the owner's staff passcode shown once. */
export function Submitted({ email, passcode, onDashboard, onCreateAnother }: { email: string; passcode: string | null; onDashboard: () => void; onCreateAnother?: () => void }) {
  const steps = [
    ['We check your licence and documents', 'Usually within 24 hours'],
    ['We email you the result', `At ${email}`],
    ['You go live', 'Patients near you can find and reserve your stock'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '0 12px' }}>
      <div className={s.submittedCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auth/submitted.svg" width={208} height={134} alt="" />
        <Text variant="h4" as="h2" color="var(--mf-text-primary)">You’re all set for now</Text>
        <Text variant="body3" color="var(--mf-text-secondary)">
          {`We’ll email ${email} when you’re approved. Until then you can add stock and set your opening hours, but patients can’t reserve from you yet.`}
        </Text>
        {passcode && (
          <div className={s.passcode} aria-live="polite">
            <Text variant="label1" color="var(--mf-text-heading)">Your staff passcode</Text>
            <span className={s.passcodeDigits}>{passcode}</span>
            <Text variant="caption1" color="var(--mf-text-secondary)">
              You need it with your email and password to sign in. Write it down: we only show it once.
            </Text>
          </div>
        )}
        <ol className={s.nextSteps}>
          {steps.map(([title, sub], i) => (
            <li key={title} className={s.nextStep}>
              <span className={`${s.num} mf-t-caption1`}>{i + 1}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text variant="label1" color="var(--mf-text-primary)">{title}</Text>
                <Text variant="caption1" color="var(--mf-text-secondary)">{sub}</Text>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <Button label="Go to dashboard" onPress={onDashboard} />
        {onCreateAnother && <div style={{ marginTop: 12 }}><Button label="Create a new pharmacy account" variant="secondary" onPress={onCreateAnother} /></div>}
      </div>
    </div>
  );
}
