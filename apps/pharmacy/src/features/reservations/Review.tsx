'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { APPROVAL_WINDOW_MINUTES, PRESCRIPTION_CHECKS, canApprove, formatNaira, type PrescriptionCheck } from '@medfind/core';
import { Badge, Button, ChecklistItem, Icon, Text, cssVar } from '@medfind/ui/web';
import { DeclineDialog } from './DeclineDialog';
import { Progress, Shell } from './Shell';
import { approve, clock, firstName, hhmm, minutesLeftToReply, paymentBadge, useNow, useReservation } from './store';
import { DELIVERY_FEE_KOBO } from '@medfind/core';
import { EmptyState } from '../common/ui';
import s from './reservations.module.css';

/** What the pharmacist reads off Grace's prescription photo (Figma "Review Grace"). */
const PRESCRIPTION = {
  patient: 'Prince Grace · 6 years old',
  prescriber: 'Feyi Wyles . Signed',
  dose: '5ml every 12 hours for 7 days · 6 years',
};

export function Crumbs({ r }: { r: { ref: string } }) {
  return (
    <div className={s.crumbs}>
      <Link href="/reservations" className={`${s.crumbLink} mf-t-label1`}>
        <Icon name="chevron-left" size={14} />
        Reservations
      </Link>
      <Text variant="label1">/</Text>
      <Text variant="label1">{r.ref}</Text>
    </div>
  );
}

/** Review Grace – 0 to 4 of 4 checked (Figma 451:18980 … 456:15464). Approve unlocks once all 4 are ticked. */
export function Review({ id }: { id: string }) {
  const router = useRouter();
  const now = useNow();
  const r = useReservation(id);
  const [ticked, setTicked] = useState<PrescriptionCheck[]>([]);
  const [declining, setDeclining] = useState(false);
  if (!now) return null;
  if (!r)
    return (
      <Shell active="reservations" heading={<Text variant="h2" as="h1" color={cssVar.text.primary}>Reservation not found</Text>}>
        <EmptyState
          icon="ticket"
          title="This reservation isn’t here any more"
          body="It may have expired, been cancelled, or the demo was reset."
          action={<Button label="Back to Reservations" onPress={() => router.push('/reservations')} />}
        />
      </Shell>
    );
  const left = minutesLeftToReply(r, now);
  const name = firstName(r.customerName);
  const subtitles: Record<PrescriptionCheck, string> = {
    medicine_and_dosage: `${r.medicineName} × ${r.quantity}`,
    patient_name_and_age: PRESCRIPTION.patient,
    prescriber_name_and_signature: PRESCRIPTION.prescriber,
    dose_suits_patient_age: PRESCRIPTION.dose,
  };
  const toggle = (key: PrescriptionCheck, on: boolean) => setTicked((t) => (on ? (t.includes(key) ? t : [...t, key]) : t.filter((k) => k !== key)));

  return (
    <Shell
      active="reservations"
      heading={
        <div className={s.headingBlock}>
          <Crumbs r={r} />
          <Text variant="h2" as="h1" color={cssVar.text.primary}>
            {r.customerName}
          </Text>
          <div className={s.tags}>
            <Badge label="Prescription" />
            <Badge label={paymentBadge(r)} tone="info" dot="left" />
          </div>
        </div>
      }
    >
      <div className={s.reviewHead} style={{ marginTop: -88, justifyContent: 'flex-end' }}>
        <div className={s.timer} style={{ marginRight: 170 }}>
          <Text variant="body1" color={cssVar.text.heading}>
            {r.status === 'review' ? `${clock(left)} mins left to reply` : 'Reply window closed'}
          </Text>
          <Progress fraction={left / (APPROVAL_WINDOW_MINUTES * 60_000)} />
        </div>
      </div>
      <div className={s.reviewGrid}>
        <section className={s.photoPanel}>
          <div className={s.photoHead}>
            <Text variant="h3" as="h2" color={cssVar.text.primary}>
              Prescription photo
            </Text>
            <span className={s.photoTools} aria-hidden>
              <Icon name="search" />
              <Icon name="minus" />
              <Icon name="category" />
            </span>
          </div>
          <div className={s.photoBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.photo} src="/demo/grace-prescription.png" alt={`Prescription for ${r.medicineName}`} />
          </div>
          <div className={s.photoFoot}>
            <Text variant="caption1" color={cssVar.text.secondary}>
              Uploaded by {name} at {hhmm(r.placedAt)} · 1 photo
            </Text>
            <span className={s.row} style={{ color: cssVar.text.secondary }}>
              <Icon name="info-circle" size={24} />
              <Text variant="body3">This prescription has been read and your checklist updated, confirm it .</Text>
            </span>
          </div>
        </section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {r.fulfilment === 'delivery' && (
            <section className={s.details} style={{ gap: 12 }}>
              <Text variant="h3" as="h2" color={cssVar.text.primary}>
                Delivery
              </Text>
              {[
                ['Deliver to', r.address ?? ''],
                ['Delivery fee', `${formatNaira(DELIVERY_FEE_KOBO)}, already paid by ${name}`],
                ['Rider', 'We assign one when you mark the order ready'],
              ].map(([k, v]) => (
                <div key={k} className={s.grow} style={{ gap: 4 }}>
                  <Text variant="body1" color={cssVar.text.heading}>
                    {k}
                  </Text>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    {v}
                  </Text>
                </div>
              ))}
            </section>
          )}
          <section className={s.checklist}>
            <div className={s.checklistHead}>
              <Text variant="h3" as="h2" color={cssVar.text.primary}>
                Your checklist
              </Text>
              <Text variant="body3" color={cssVar.text.secondary}>
                You have to tick each one before you can confirm.
              </Text>
            </div>
            <div className={s.checklistItems}>
              {PRESCRIPTION_CHECKS.map((c) => (
                <ChecklistItem
                  key={c.key}
                  title={c.label}
                  subtitle={subtitles[c.key]}
                  checked={ticked.includes(c.key)}
                  onChange={(on) => toggle(c.key, on)}
                />
              ))}
            </div>
          </section>
          {r.status !== 'review' && (
            <div className={s.buttons}>
              <Button label="Back to Reservations" variant="secondary" fullWidth onPress={() => router.push('/reservations')} />
            </div>
          )}
          {r.status === 'review' && (
            <div className={s.buttons} style={{ marginTop: 8 }}>
              <Button
                label="Approve"
                fullWidth
                disabled={!canApprove(r.kind, ticked)}
                onPress={() => {
                  approve(r.id);
                  router.push(`/reservations/${r.id}/confirmed`);
                }}
              />
              <Button label="Decline" variant="destructive-secondary" fullWidth onPress={() => setDeclining(true)} />
            </div>
          )}
        </div>
      </div>
      {declining && (
        <DeclineDialog id={r.id} name={name} onClose={() => setDeclining(false)} onDeclined={() => router.push('/reservations')} />
      )}
    </Shell>
  );
}

/** Route wrapper: reads the reservation id from the URL. */
export function ReviewRoute() {
  return <Review id={useParams<{ id: string }>().id} />;
}
