'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APPROVAL_WINDOW_MINUTES, PICKUP_WINDOW_MINUTES, formatNaira, pickupDeadline } from '@medfind/core';
import { Badge, Button, Text, cssVar } from '@medfind/ui/web';
import { DeclineDialog } from './DeclineDialog';
import { Progress, Shell } from './Shell';
import { activityToday, approve, clock, firstName, initials, minutesLeftToReply, useNow, useReservations, type PharmacyReservation } from './store';
import s from './reservations.module.css';

const WINDOW_MS = APPROVAL_WINDOW_MINUTES * 60_000;
const PICKUP_MS = PICKUP_WINDOW_MINUTES * 60_000;

function tone(left: number, total: number): 'brand' | 'warning' | 'error' {
  const f = left / total;
  return f <= 1 / 3 ? 'error' : f <= 1 / 2 ? 'warning' : 'brand';
}
const toneColor = { brand: cssVar.text.heading, warning: cssVar.tone.warning.text, error: cssVar.text.error };

function CardTop({ r }: { r: PharmacyReservation }) {
  const pay = `Pay in person · ${formatNaira(r.totalKobo)}`;
  return (
    <>
      <div className={s.row} style={{ alignItems: 'flex-start' }}>
        <span className={`${s.avatar} mf-t-h5`}>{initials(r.customerName)}</span>
        <div className={s.grow} style={{ gap: 16, paddingTop: 16 }}>
          <Text variant="h5" color={cssVar.text.primary}>
            {r.customerName}
          </Text>
          <Text variant="body3" color={cssVar.text.body}>
            {r.medicineName} × {r.quantity}
          </Text>
        </div>
      </div>
      <div className={s.tags}>
        <Badge label={r.kind === 'prescription' ? 'Prescription' : 'OTC'} appearance="outline" />
        <Badge label={r.fulfilment === 'delivery' ? `Delivery · ${formatNaira(r.totalKobo)}` : pay} tone="neutral" dot="left" />
      </div>
    </>
  );
}

function ReviewCard({ r, now, onDecline }: { r: PharmacyReservation; now: number; onDecline: () => void }) {
  const router = useRouter();
  const left = minutesLeftToReply(r, now);
  const t = tone(left, WINDOW_MS);
  return (
    <div className={s.resCard}>
      <CardTop r={r} />
      <Text variant="body3" color={toneColor[t]}>
        {clock(left)} mins left
      </Text>
      <Progress fraction={left / WINDOW_MS} tone={t} />
      {r.kind === 'prescription' ? (
        <div>
          <Button label="Review prescription" size="medium" onPress={() => router.push(`/reservations/${r.id}`)} />
        </div>
      ) : (
        <div className={s.row}>
          <Button label="Confirm" size="medium" onPress={() => approve(r.id)} />
          <Button label="Decline" variant="destructive-inline" size="medium" onPress={onDecline} />
        </div>
      )}
    </div>
  );
}

function ReadyCard({ r, now }: { r: PharmacyReservation; now: number }) {
  const left = Math.max(0, pickupDeadline(r.readyAt!).getTime() - now);
  const t = tone(left, PICKUP_MS);
  return (
    <div className={s.resCard}>
      <CardTop r={r} />
      <Text variant="body3" color={toneColor[t]}>
        {clock(left, true)} hours left
      </Text>
      <Progress fraction={left / PICKUP_MS} tone={t} />
      <div className={s.between}>
        <Button label="Picked up" variant="secondary" size="medium" />
        <Text variant="body3" color={cssVar.text.body}>
          {r.pickupCode ? `${r.pickupCode.slice(0, 3)} ${r.pickupCode.slice(3)}` : r.ref}
        </Text>
      </div>
    </div>
  );
}

function Column({ title, count, countTone, children }: { title: string; count: number; countTone: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <section className={s.column}>
      <div className={s.between}>
        <Text variant="h5" as="h2" color={cssVar.text.heading}>
          {title}
        </Text>
        <span
          className={`${s.count} mf-t-h5`}
          style={{ background: cssVar.tone[countTone].bg, color: cssVar.tone[countTone].text }}
        >
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

/** Reservations (Figma 196:3840): Review and Ready columns, and today's activity. */
export function Board() {
  const now = useNow();
  const all = useReservations();
  const [declining, setDeclining] = useState<PharmacyReservation | null>(null);
  const review = all.filter((r) => r.status === 'review');
  const ready = all.filter((r) => r.status === 'ready');
  const ended = all
    .filter((r) => r.live && (r.status === 'declined' || r.status === 'expired' || r.status === 'ready'))
    .map((r) => ({
      name: r.customerName,
      detail: r.medicineName,
      label: r.status === 'ready' ? 'Confirmed' : r.status === 'declined' ? 'Declined' : 'Expired',
      tone: r.status === 'ready' ? ('success' as const) : ('error' as const),
    }));
  const activity = [...ended, ...activityToday];
  if (!now) return null;

  return (
    <Shell
      active="reservations"
      heading={
        <div className={s.headingBlock}>
          <Text variant="h2" as="h1" color={cssVar.text.primary}>
            Reservations
          </Text>
          <Text variant="body3" color={cssVar.text.secondary}>
            Review prescriptions and confirm pickups. Reply within {APPROVAL_WINDOW_MINUTES} minutes
          </Text>
        </div>
      }
    >
      <div className={s.board}>
        <Column title="Review" count={review.length} countTone="error">
          {review.map((r) => (
            <ReviewCard key={r.id} r={r} now={now} onDecline={() => setDeclining(r)} />
          ))}
        </Column>
        <Column title="Ready" count={ready.length} countTone="success">
          {ready.map((r) => (
            <ReadyCard key={r.id} r={r} now={now} />
          ))}
        </Column>
        <section className={s.activity}>
          <div className={`${s.between} ${s.activityHead}`}>
            <Text variant="h5" as="h2" color={cssVar.text.heading}>
              Activity today
            </Text>
            <span className={`${s.count} mf-t-h5`} style={{ background: cssVar.surface.border, color: cssVar.text.heading }}>
              {25 + ended.length}
            </span>
          </div>
          {activity.map((a, i) => (
            <div key={i} className={s.activityRow}>
              <div className={s.grow} style={{ gap: 16 }}>
                <Text variant="h5" color={cssVar.text.primary}>
                  {a.name}
                </Text>
                <Text variant="body3" color={cssVar.text.secondary}>
                  {a.detail}
                </Text>
              </div>
              <Badge label={a.label} tone={a.tone} dot="left" />
            </div>
          ))}
          <div style={{ padding: '24px 16px', borderTop: `1px solid ${cssVar.surface.border}` }}>
            <Button label="View all" variant="text" size="small" icon="chevron-right" />
          </div>
        </section>
      </div>
      {declining && <DeclineDialog name={firstName(declining.customerName)} id={declining.id} onClose={() => setDeclining(null)} />}
    </Shell>
  );
}
