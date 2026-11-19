'use client';

import { useParams, useRouter } from 'next/navigation';
import { PICKUP_WINDOW_MINUTES, formatNaira, pickupDeadline } from '@medfind/core';
import { Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { Crumbs } from './Review';
import { Progress, Shell } from './Shell';
import { clock, firstName, hhmm, useNow, useReservation, useReservations } from './store';
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
  if (!r?.readyAt || !now) return null;
  const deadline = pickupDeadline(r.readyAt);
  const left = Math.max(0, deadline.getTime() - now);
  const name = firstName(r.customerName);
  const code = `${r.pickupCode.slice(0, 3)} ${r.pickupCode.slice(3)}`;

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
          Reservation confirmed
        </Text>
        <Text variant="body2" as="p" color={cssVar.text.secondary}>
          {name} has been told her medicine is ready. Keep it at the counter until she comes.
        </Text>
      </div>
      <div className={s.reviewGrid} style={{ gridTemplateColumns: 'minmax(0, 683fr) minmax(0, 330fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          <section className={s.details}>
            <div className={s.codeRow}>
              <div className={s.headingBlock}>
                <Text variant="label1" color={cssVar.text.brand}>
                  Pickup code
                </Text>
                <span className={`${s.code} mf-t-h3`}>{code}</span>
              </div>
              <div className={s.headingBlock} style={{ alignItems: 'flex-end' }}>
                <Text variant="body3" color={cssVar.text.heading}>
                  Held until {hhmm(deadline)}
                </Text>
                <Text variant="caption1" color={cssVar.text.secondary}>
                  {clock(left, true)} hours left
                </Text>
              </div>
            </div>
            <Detail label="Patient" value={`${r.customerName} · for her son Prince, 6 years`} />
            <Detail label="Medicine" value={`${r.medicineName} × ${r.quantity} bottle`} />
            <Detail label="Prescription" value={`Checked by ${r.approvedBy} at ${hhmm(r.readyAt)}`} />
            <Detail label="Payment" value={`${formatNaira(r.totalKobo)} to pay at the counter`} />
            <Detail label="Stock" value="56 left after this" />
          </section>
          <div className={s.note}>
            <Icon name="time-circle" size={20} color={cssVar.text.secondary} />
            <Text variant="caption1" color={cssVar.text.secondary}>
              Not collected by {hhmm(deadline)}? It expires on its own and the bottle goes back into stock.
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
                When {name} arrives, ask for her pickup code, only hand over the medicine if it matches {code}.
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
