'use client';

import { useParams, useRouter } from 'next/navigation';
import { DELIVERY_FEE_KOBO, PICKUP_WINDOW_MINUTES, formatNaira, pickupDeadline } from '@medfind/core';
import { Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { Crumbs } from './Review';
import { EmptyState } from '../common/ui';
import { Progress, Shell } from './Shell';
import { RIDER, clock, firstName, his, hhmm, useNow, useReservation, useReservations } from './store';
import s from './reservations.module.css';

const TIPS = [
  'Bag or pack the medicine',
  'Stick the label on the bag or pack with code so it is not mistakenly sold',
  'Set the medication aside',
  'Show expiry dates if you can',
];

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.detailRow}>
      <Text variant="body2" color={cssVar.text.secondary}>
        {label}
      </Text>
      <Text variant="body2" color={cssVar.text.heading}>
        {value}
      </Text>
    </div>
  );
}

/** Grace – reservation confirmed (Figma 473:10835). Pay at pharmacy only. */
export function Confirmed({ id }: { id: string }) {
  const router = useRouter();
  const now = useNow();
  const r = useReservation(id);
  const waiting = useReservations().filter((x) => x.status === 'review').length;
  if (!now) return null;
  if (!r?.readyAt)
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
  const deadline = pickupDeadline(r.readyAt);
  const left = Math.max(0, deadline.getTime() - now);
  const name = firstName(r.customerName);
  const delivery = r.fulfilment === 'delivery';
  const code = delivery || !r.pickupCode ? r.ref : `${r.pickupCode.slice(0, 3)} ${r.pickupCode.slice(3)}`;
  const riderAt = new Date(r.readyAt.getTime() + 8 * 60_000);
  const payment = delivery
    ? `${formatNaira(r.totalKobo)} paid online · includes ${formatNaira(DELIVERY_FEE_KOBO)} delivery`
    : r.payment === 'counter'
      ? `${formatNaira(r.totalKobo)} to pay at the counter`
      : `${formatNaira(r.totalKobo)} paid online`;

  return (
    <Shell
      active="reservations"
      heading={
        <div className={s.headingBlock} style={{ gap: 16 }}>
          <Crumbs r={r} />
          <div className={s.timer}>
            <Text variant="body3" color={cssVar.text.heading}>
              {clock(left, true)} hours left
            </Text>
            <Progress fraction={left / (PICKUP_WINDOW_MINUTES * 60_000)} />
          </div>
        </div>
      }
    >
      <div className={s.headingBlock} style={{ gap: 24, maxWidth: 540 }}>
        <span className={s.tick}>
          <Icon name="tick" size={32} />
        </span>
        <Text variant="h3" as="h1" color={cssVar.text.heading}>
          {delivery ? 'Delivery confirmed' : 'Reservation confirmed'}
        </Text>
        <Text variant="body2" as="p" color={cssVar.text.secondary}>
          {delivery
            ? `${name} has been told ${his(r)} order is being packed. ${RIDER.name} (${RIDER.plate}) is on his way to collect it.`
            : `${name} has been told ${his(r)} medicine is ready. Keep it at the counter until ${r.pronoun} comes.`}
        </Text>
      </div>
      <div className={s.reviewGrid} style={{ gridTemplateColumns: 'minmax(0, 683fr) minmax(0, 330fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          <section className={s.details}>
            <div className={s.codeRow}>
              <div className={s.headingBlock}>
                <Text variant="label1" color={cssVar.text.brand}>
                  {delivery ? 'Order code' : 'Pickup code'}
                </Text>
                <span className={`${s.code} mf-t-h3`}>{code}</span>
              </div>
              <div className={s.headingBlock} style={{ alignItems: 'flex-end' }}>
                <Text variant="body3" color={cssVar.text.heading}>
                  {delivery ? `Rider arrives ${hhmm(riderAt)}` : `Held until ${hhmm(deadline)}`}
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {clock(left, true)} hours left
                </Text>
              </div>
            </div>
            <Detail label="Patient" value={r.patient ? `${r.customerName} · ${r.patient}` : r.customerName} />
            <Detail label="Medicine" value={`${r.medicineName} × ${r.quantity}${r.unit ? ` ${r.unit}` : ''}`} />
            <Detail label="Prescription" value={r.kind === 'prescription' ? `Checked by ${r.approvedBy} at ${hhmm(r.readyAt)}` : 'Not needed · over-the-counter'} />
            <Detail label="Payment" value={payment} />
            <Detail label="Stock" value="56 left after this" />
          </section>
          <div className={s.note}>
            <Icon name="time-circle" size={20} color={cssVar.text.secondary} />
            <Text variant="caption1" color={cssVar.text.secondary}>
              {delivery
                ? `No rider in 30 minutes? We reassign one and let ${name} know. You don’t need to do anything.`
                : `Not collected by ${hhmm(deadline)}? It expires on its own and the medicine goes back into stock.`}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section className={s.alert} style={{ flexDirection: 'row', gap: 16 }}>
            <span style={{ color: cssVar.text.brand }}>
              <Icon name="category" />
            </span>
            <div className={s.headingBlock} style={{ gap: 24 }}>
              <Text variant="body1" color={cssVar.text.primary}>
                Always check the code before you hand over
              </Text>
              <Text variant="body3" color={cssVar.text.secondary}>
                {delivery
                  ? `When ${RIDER.first} arrives, ask for his rider code and only hand over the bag if it matches.`
                  : `When ${name} arrives, ask for ${his(r)} pickup code, only hand over the medicine if it matches ${code}.`}
              </Text>
            </div>
          </section>
          <section className={s.tips}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Text variant="body1" color={cssVar.text.heading}>
                Quicktips
              </Text>
              {TIPS.map((t) => (
                <span key={t} className={s.tip}>
                  <Icon name="info-circle" />
                  <Text variant="body3" color={cssVar.text.secondary}>
                    {t}
                  </Text>
                </span>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${cssVar.divider}` }}>
              <span className={s.tip}>
                <Icon name="info-circle" />
                <Text variant="body3" color={cssVar.text.secondary}>
                  These tips help with ease and protects patients when shifts change
                </Text>
              </span>
            </div>
          </section>
        </div>
      </div>
      <div className={s.footer}>
        {waiting > 0 && (
          <Text variant="caption1" color={cssVar.text.secondary}>
            {waiting} more need{waiting === 1 ? 's' : ''} your reply
          </Text>
        )}
        <Button label="Back to Reservations" onPress={() => router.push('/reservations')} />
      </div>
    </Shell>
  );
}

/** Route wrapper: reads the reservation id from the URL. */
export function ConfirmedRoute() {
  return <Confirmed id={useParams<{ id: string }>().id} />;
}
