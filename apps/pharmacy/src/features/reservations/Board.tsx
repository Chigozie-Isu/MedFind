'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APPROVAL_WINDOW_MINUTES, PICKUP_WINDOW_MINUTES, pickupDeadline } from '@medfind/core';
import { Badge, Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { DeclineDialog } from './DeclineDialog';
import { Progress, Shell } from './Shell';
import {
  RIDER,
  approve,
  clock,
  firstName,
  handOver,
  initials,
  markCollected,
  minutesLeftToReply,
  paymentBadge,
  riderEta,
  useNow,
  useReservations,
  useToday,
  type PharmacyReservation,
} from './store';
import { CodeBox, EmptyState, Modal, Skeleton, WarningNote, notify, useFirstLoad } from '../common/ui';
import s from './reservations.module.css';

const WINDOW_MS = APPROVAL_WINDOW_MINUTES * 60_000;
const PICKUP_MS = PICKUP_WINDOW_MINUTES * 60_000;

function tone(left: number, total: number): 'brand' | 'warning' | 'error' {
  const f = left / total;
  return f <= 1 / 3 ? 'error' : f <= 1 / 2 ? 'warning' : 'brand';
}
const toneColor = { brand: cssVar.text.heading, warning: cssVar.tone.warning.text, error: cssVar.text.error };

function CardTop({ r }: { r: PharmacyReservation }) {
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
        <Badge label={paymentBadge(r)} tone={r.payment === 'online' && r.fulfilment === 'pickup' ? 'info' : 'neutral'} dot="left" />
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
          <Button
            label="Confirm"
            size="medium"
            onPress={() => {
              approve(r.id);
              if (r.fulfilment === 'delivery') router.push(`/reservations/${r.id}/confirmed`);
              else notify(`${firstName(r.customerName)}’s reservation confirmed`, `${firstName(r.customerName)} has been told it’s ready. It moves to Ready until it’s picked up.`);
            }}
          />
          <Button label="Decline" variant="destructive-inline" size="medium" onPress={onDecline} />
        </div>
      )}
    </div>
  );
}

function ReadyCard({ r, now, onHandOver }: { r: PharmacyReservation; now: number; onHandOver: () => void }) {
  if (r.fulfilment === 'delivery') {
    const eta = riderEta(r, now);
    return (
      <div className={s.resCard}>
        <CardTop r={r} />
        <Text variant="body3" color={cssVar.text.heading}>
          {eta > 0 ? `Rider arriving in ${eta} min${eta === 1 ? '' : 's'}` : `${RIDER.first} is here`}
        </Text>
        <Progress fraction={1 - eta / 8} />
        <div className={s.between}>
          <Button label="Hand to rider" variant="secondary" size="medium" onPress={onHandOver} />
          <Text variant="body3" color={cssVar.text.body}>
            {r.ref}
          </Text>
        </div>
      </div>
    );
  }
  const left = Math.max(0, pickupDeadline(r.readyAt!).getTime() - now);
  const t = tone(left, PICKUP_MS);
  return (
    <div className={s.resCard}>
      <CardTop r={r} />
      <Text variant="body3" color={toneColor[t]}>
        {clock(left, true)} {left >= 3_600_000 ? 'hours' : 'mins'} left
      </Text>
      <Progress fraction={left / PICKUP_MS} tone={t} />
      <div className={s.between}>
        <Button label={r.payment === 'counter' ? 'Paid and Picked up' : 'Picked up'} variant="secondary" size="medium" onPress={() => markCollected(r.id)} />
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
        <span className={`${s.count} mf-t-h5`} style={{ background: cssVar.tone[countTone].bg, color: cssVar.tone[countTone].text }}>
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

/** Figma "Reservations – hand over to rider" (2072:17999). */
function HandOverDialog({ r, onClose, onDone }: { r: PharmacyReservation; onClose: () => void; onDone: () => void }) {
  return (
    <Modal
      icon="shield-tick"
      title="Hand over to the rider"
      subtitle={`${RIDER.name} is here for ${firstName(r.customerName)}’s order ${r.ref}. Ask for his code and check it matches before you hand over the bag.`}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button
            label="Confirm hand-over"
            onPress={() => {
              handOver(r.id);
              onDone();
            }}
          />
        </>
      }
    >
      <CodeBox code={RIDER.code} caption={`Rider code · ${RIDER.name} · ${RIDER.plate}`} />
      <WarningNote title="Only hand over if the codes match" body="If they don’t match, keep the order and call MedFind on 0700 633 3463." />
    </Modal>
  );
}

/** Figma "Ned – tracking delivery" (2494:88714). */
export function TrackingDialog({ r, onClose }: { r: PharmacyReservation; onClose: () => void }) {
  const delivered = r.status === 'delivered';
  const steps = [
    { label: 'Order confirmed', detail: `Packed and labelled ${r.ref}`, state: 'Done' },
    { label: `Picked up by ${RIDER.first}`, detail: 'Rider code matched', state: 'Done' },
    { label: `On the way to ${firstName(r.customerName)}`, detail: delivered ? 'Arrived' : '2.1 km away · arriving in about 8 mins', state: delivered ? 'Done' : 'Now' },
    { label: 'Delivered', detail: `When ${RIDER.first} enters ${firstName(r.customerName)}’s delivery code`, state: delivered ? 'Done' : 'Next' },
  ];
  return (
    <Modal title={`Tracking ${r.ref} · ${r.customerName}`} subtitle={`Delivering to ${(r.address ?? '').split(' · ')[0]} · ${r.medicineName} × ${r.quantity}`} onClose={onClose} width={720}>
      <div className={s.map} aria-label="Map of the rider’s route" role="img">
        <RouteMap progress={delivered ? 1 : 0.6} />
      </div>
      <div className={s.columns} style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)' }}>
        <div className={s.timeline}>
          {steps.map((st) => (
            <div key={st.label} className={s.row} style={{ alignItems: 'flex-start', gap: 12 }}>
              <Badge label={st.state} tone={st.state === 'Done' ? 'success' : st.state === 'Now' ? 'info' : 'neutral'} dot="left" />
              <div className={s.grow} style={{ gap: 4 }}>
                <Text variant="body2" color={cssVar.text.heading}>
                  {st.label}
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {st.detail}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div className={s.riderCard}>
          <Text variant="caption1" color={cssVar.text.secondary}>
            Your rider
          </Text>
          <Text variant="body2" color={cssVar.text.heading}>
            {RIDER.name}
          </Text>
          <Text variant="caption1" color={cssVar.text.secondary}>
            {RIDER.bike} · {RIDER.plate}
          </Text>
          <Button
            label={`Call ${RIDER.first}`}
            variant="secondary"
            size="small"
            iconLeft="message"
            fullWidth
            onPress={() => notify(`Calling ${RIDER.name}`, `${RIDER.phone} · Your phone will ring first, then connect you to ${RIDER.first}. (Demo: no call is made.)`, 'info')}
          />
        </div>
      </div>
    </Modal>
  );
}

/** A simple drawn street map with the route, so the demo needs no map tiles. */
function RouteMap({ progress }: { progress: number }) {
  return (
    <svg viewBox="0 0 660 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="660" height="220" fill="var(--mf-surface-default)" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60 - 30} y2="220" stroke="var(--mf-surface-border)" strokeWidth="6" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50 + 20} x2="660" y2={i * 50 + 10} stroke="var(--mf-surface-border)" strokeWidth="6" />
      ))}
      <path d="M0 160 C 120 120, 200 200, 330 130 S 560 60, 660 90" stroke="var(--mf-tone-warning-dot)" strokeWidth="10" fill="none" opacity="0.6" />
      <path id="route" d="M80 170 L 180 150 L 260 120 L 380 110 L 470 70 L 560 60" stroke="var(--mf-brand-default)" strokeWidth="5" fill="none" strokeDasharray="10 8" />
      <circle cx="80" cy="170" r="10" fill="var(--mf-brand-default)" />
      <circle cx="560" cy="60" r="10" fill="var(--mf-accent)" />
      <circle cx={80 + (560 - 80) * progress} cy={170 - (170 - 60) * progress} r="12" fill="var(--mf-surface-raised)" stroke="var(--mf-brand-default)" strokeWidth="4" />
    </svg>
  );
}

/** Reservations (Figma 196:3840 and the delivery frames): Review and Ready columns, and today's activity. */
export function Board() {
  const router = useRouter();
  const now = useNow();
  const all = useReservations();
  const { lines, count } = useToday();
  const loading = useFirstLoad('reservations');
  const [declining, setDeclining] = useState<PharmacyReservation | null>(null);
  const [handing, setHanding] = useState<PharmacyReservation | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);
  const [handedId, setHandedId] = useState<string | null>(null);
  const review = all.filter((r) => r.status === 'review');
  const ready = all.filter((r) => r.status === 'ready');
  const handed = all.find((r) => r.id === handedId && r.status === 'out');
  const tracked = all.find((r) => r.id === tracking);
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
      {loading ? (
        <Skeleton rows={4} cards={3} />
      ) : review.length + ready.length === 0 && !handed ? (
        <section className={s.panel}>
          <EmptyState
            icon="ticket"
            title="You have no reservations"
            body={`Once patients reserve, they show up here. You’ll have ${APPROVAL_WINDOW_MINUTES} minutes to reply, and we’ll alert this screen and the Dashboard.`}
            action={
              <div className={s.row}>
                <Button label="Add stock" variant="secondary" onPress={() => router.push('/inventory/add')} />
                <Button label="View activity" onPress={() => router.push('/activity')} />
              </div>
            }
          />
        </section>
      ) : (
        <div className={s.board}>
          <Column title="Review" count={review.length} countTone="error">
            {review.map((r) => (
              <ReviewCard key={r.id} r={r} now={now} onDecline={() => setDeclining(r)} />
            ))}
            {review.length === 0 && (
              <Text variant="body3" color={cssVar.text.secondary}>
                Nothing waiting. New reservations appear here.
              </Text>
            )}
          </Column>
          <Column title="Ready" count={ready.length} countTone="success">
            {ready.map((r) => (
              <ReadyCard key={r.id} r={r} now={now} onHandOver={() => setHanding(r)} />
            ))}
            {ready.length === 0 && (
              <Text variant="body3" color={cssVar.text.secondary}>
                Confirmed orders wait here until they’re picked up.
              </Text>
            )}
          </Column>
          <section className={s.activity}>
            <div className={`${s.between} ${s.activityHead}`}>
              <Text variant="h5" as="h2" color={cssVar.text.heading}>
                Activity today
              </Text>
              <span className={`${s.count} mf-t-h5`} style={{ background: cssVar.surface.border, color: cssVar.text.heading }}>
                {count}
              </span>
            </div>
            {lines.slice(0, 6).map((a, i) => (
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
              <Button label="View all" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/activity')} />
            </div>
          </section>
        </div>
      )}
      {handed && (
        <div className={s.handBanner}>
          <Icon name="tick-circle" size={20} color={cssVar.text.success} />
          <Text variant="body3">
            Handed to {RIDER.first} · {firstName(handed.customerName)} can track the rider now
          </Text>
          <Button label="Track order" size="small" onPress={() => setTracking(handed.id)} />
          <button type="button" className={s.closeBtn} onClick={() => setHandedId(null)} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {declining && <DeclineDialog name={firstName(declining.customerName)} id={declining.id} onClose={() => setDeclining(null)} />}
      {handing && (
        <HandOverDialog
          r={handing}
          onClose={() => setHanding(null)}
          onDone={() => {
            setHandedId(handing.id);
            setHanding(null);
          }}
        />
      )}
      {tracked && <TrackingDialog r={tracked} onClose={() => setTracking(null)} />}
    </Shell>
  );
}
