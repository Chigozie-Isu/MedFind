'use client';

import { APPROVAL_WINDOW_MINUTES } from '@medfind/core';
import { Badge, Button, Icon, InsightCard, Text, cssVar } from '@medfind/ui/web';
import { useRouter } from 'next/navigation';
import { Shell } from './Shell';
import { stockStatus, useWorkspace } from '../workspace/store';
import { Skeleton, useFirstLoad } from '../common/ui';
import { staff, useNow, useReservations } from './store';
import s from './reservations.module.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function greeting(d: Date): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Sample rows from Figma "Trending near you" and "Running low". */
const trending = [
  { name: 'Artemether/lumefantrine 80/480mg', searches: 212, up: 64, stock: ['In stock', 'success'], action: 'Add stock' },
  { name: 'Cetirizine 10mg', searches: 200, up: 60, stock: ['In stock', 'success'], action: 'Restock' },
  { name: 'Amlodipine 5mg', searches: 127, up: 50, stock: ['Out of stock', 'error'], action: 'Restock' },
  { name: 'Salbutamol inhaler 100mcg', searches: 212, up: 40, stock: ['Low stock', 'warning'], action: 'Restock' },
] as const;
const insights = [
  { title: 'Collected today', value: '25', insight: '4 more than last Monday', href: '/activity' },
  { title: 'Sales today', value: '₦42,900', insight: '₦28,600 online · ₦14,300 counter', href: '/earnings' },
  { title: 'Avg reply time', value: '4 min', insight: 'Quick to respond', href: '/reservations' },
];

/** Dashboard (Figma 167:2472). The waiting card counts live reservations. */
export function Dashboard() {
  const router = useRouter();
  const workspace = useWorkspace();
  const tick = useNow();
  const now = new Date(tick);
  const waiting = useReservations()
    .filter((r) => r.status === 'review')
    .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());
  const oldest = waiting[0];
  const todaySales = workspace.transactions.filter(t => t.method !== 'Payout' && new Date(t.at).toDateString() === now.toDateString());
  const salesValue = todaySales.reduce((sum, t) => sum + t.paidKobo, 0);
  const cards = workspace.isNewPharmacy ? [
    { title: 'Collected today', value: String(todaySales.length), insight: 'Completed reservations', href: '/activity' },
    { title: 'Sales today', value: `₦${(salesValue / 100).toLocaleString('en-NG')}`, insight: `${todaySales.length} completed sales`, href: '/earnings' },
    { title: 'Avg reply time', value: '—', insight: 'No reservations yet', href: '/reservations' },
  ] : insights;
  const loading = useFirstLoad('dashboard');
  const low = workspace.items.filter((i) => stockStatus(i) !== 'in').slice(0, 3);
  if (!tick) return null;
  const waitedMins = oldest ? Math.floor((now.getTime() - oldest.placedAt.getTime()) / 60_000) : 0;

  if (workspace.isNewPharmacy) {
    const steps = [
      { title: 'Create your account', description: 'Your pharmacy details are saved.', done: !!workspace.pharmacy, href: '/profile' },
      { title: 'Submit licence and documents', description: 'Your submitted documents are being reviewed.', done: false, href: '/sign-up' },
      { title: 'Add a payout account', description: 'Where your online earnings go every second Friday.', done: !!workspace.payoutLast4, href: '/profile' },
      { title: 'Add your medicines', description: 'Patients can only find what is in your inventory.', done: workspace.items.length > 0, href: '/inventory/add', action: 'Add stock' },
      { title: 'Set your opening hours', description: 'So patients know when they can collect.', done: workspace.hoursConfigured === true, href: '/profile', action: 'Set hours' },
    ];
    const completed = steps.filter(step => step.done).length;
    return (
      <Shell active="dashboard" heading={<div className={s.headingBlock}>
        <Text variant="h3" as="h1" color={cssVar.text.heading}>{greeting(now)}, {workspace.staffName.split(' ')[0] || 'there'}</Text>
        <Text variant="body2" color={cssVar.text.secondary}>Let's get {workspace.pharmacy || 'your pharmacy'} ready for patients.</Text>
      </div>}>
        <section className={s.panel} style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className={s.between}>
            <div>
              <Text variant="h3" as="h2" color={cssVar.text.heading}>Get ready to go live</Text>
              <Text variant="body2" color={cssVar.text.secondary}>{completed} of 5 steps done</Text>
            </div>
            <Text variant="h3" color={cssVar.text.heading}>{Math.round(completed / 5 * 100)}%</Text>
          </div>
          <div style={{ height: 8, background: '#E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${completed / 5 * 100}%`, height: '100%', background: 'var(--mf-brand-default)', borderRadius: 8 }} />
          </div>
          {steps.map((step, index) => (
            <div key={step.title} className={s.between} style={{ padding: '16px 0', borderBottom: '1px solid var(--mf-surface-border)', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--mf-surface-border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {step.done ? <Icon name="check-circle" size={20} /> : index + 1}
                </span>
                <div>
                  <Text variant="h5" color={cssVar.text.heading}>{step.title}</Text>
                  <Text variant="body2" color={cssVar.text.secondary}>{step.description}</Text>
                </div>
              </div>
              {step.action && !step.done ? <Button label={step.action} size="small" variant="secondary" onPress={() => router.push(step.href)} /> :
                <Badge label={step.done ? 'Done' : index === 1 ? 'In review' : 'To do'} tone={step.done ? 'success' : 'info'} />}
            </div>
          ))}
          <div className={s.between} style={{ gap: 20, paddingTop: 16 }}>
            <div>
              <Text variant="h5" color={cssVar.text.heading}>Add employees · optional</Text>
              <Text variant="body2" color={cssVar.text.secondary}>Add employees and generate codes so you can know who does what.</Text>
            </div>
            <Button label="Add employees" variant="secondary" onPress={() => router.push('/profile')} />
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell
      active="dashboard"
      heading={
        <div className={s.headingBlock}>
          <Text variant="h3" as="h1" color={cssVar.text.heading}>
            {greeting(now)}, {workspace.staffName.split(' ')[0] || staff.firstName}
          </Text>
          <Text variant="body2" color={cssVar.text.secondary}>
            {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]} · {String(now.getHours()).padStart(2, '0')}:
            {String(now.getMinutes()).padStart(2, '0')}
          </Text>
        </div>
      }
    >
      {loading ? <Skeleton rows={3} cards={3} /> : <>
      <div className={s.insights}>
        {cards.map((c) => (
          <div key={c.title} role="link" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => router.push(c.href)} onKeyDown={(e) => e.key === 'Enter' && router.push(c.href)}>
            <InsightCard title={c.title} value={c.value} insight={c.insight} />
          </div>
        ))}
      </div>

      {oldest && (
        <div className={s.alert}>
          <Badge label="Running out of time" tone="error" dot="left" />
          <Text variant="h3" as="h2" color={cssVar.text.primary}>
            {waiting.length === 1 ? '1 reservation is' : `${waiting.length} reservations are`} waiting for you
          </Text>
          <Text variant="body2" as="p" color={cssVar.text.secondary}>
            The oldest has waited {waitedMins} {waitedMins === 1 ? 'minute' : 'minutes'}. You have to reply in {APPROVAL_WINDOW_MINUTES} minutes or the
            reservation will be automatically declined.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button
              label={oldest.kind === 'prescription' ? 'Review prescription' : 'Review reservation'}
              icon="chevron-right"
              onPress={() => router.push(oldest.kind === 'prescription' ? `/reservations/${oldest.id}` : '/reservations')}
            />
          </div>
        </div>
      )}

      <div className={s.columns}>
        <section className={s.panel}>
          <div className={s.headingBlock}>
            <Text variant="h3" as="h2" color={cssVar.text.heading}>
              <span className="mf-tm-h3">Trending near you</span>
            </Text>
            <Text variant="label2" color={cssVar.text.secondary}>
              What patients within 5 km searched for in the last 7 days
            </Text>
          </div>
          {trending.map((t) => (
            <div key={t.name} className={s.row}>
              <span className={s.thumb}>
                <Icon name="box" />
              </span>
              <div className={s.grow}>
                <Text variant="label1" color={cssVar.text.primary}>
                  {t.name}
                </Text>
                <span>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    {t.searches} searches ·{' '}
                  </Text>
                  <Text variant="label2" color={cssVar.text.success}>
                    up {t.up}%
                  </Text>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                <Badge label={t.stock[0]} tone={t.stock[1]} dot="left" />
                <Button label={t.action} variant="text" size="small" iconLeft={t.action === 'Add stock' ? 'add' : undefined} icon={t.action === 'Restock' ? 'chevron-right' : undefined} onPress={() => router.push(t.action === 'Add stock' ? '/inventory/add' : '/inventory?tab=low')} />
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section className={s.panel}>
            <div className={s.between} style={{ alignItems: 'flex-start' }}>
              <div className={s.grow}>
                <span className="mf-tm-h3" style={{ color: cssVar.text.heading }}>
                  Today so far
                </span>
                <Text variant="h2" color={cssVar.text.heading}>
                  ₦42,900
                </Text>
                <Text variant="label1" color={cssVar.text.secondary}>
                  in sales · ₦28,600 online, ₦14,300 at the counter
                </Text>
                <span className={s.row} style={{ gap: 8, color: cssVar.text.secondary }}>
                  <Icon name="wallet" size={16} />
                  <Text variant="label1">Next payout Friday 27 Nov · ₦196,950</Text>
                </span>
              </div>
              <Button label="Earnings" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/earnings')} />
            </div>
          </section>
          <section className={s.panelBordered}>
            <div className={s.between}>
              <Text variant="h4" as="h2" color={cssVar.text.heading}>
                Running low
              </Text>
              <Button label="Restock" variant="text" size="small" icon="chevron-right" onPress={() => router.push('/inventory?tab=low')} />
            </div>
            {low.map((i) => ({ name: `${i.brand} ${i.dosage}`, detail: `${i.generic} · ${i.pack}`, badge: i.quantity === 0 ? (['Out of stock', 'error'] as const) : ([`${i.quantity} left`, 'warning'] as const), id: i.id })).map((r) => (
              <div key={r.id} className={s.row} role="link" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => router.push(`/inventory/add?restock=${r.id}`)}>
                <span className={s.thumb}>
                  <Icon name="box" />
                </span>
                <div className={s.grow}>
                  <div className={s.between}>
                    <span className="mf-tm-h5" style={{ color: cssVar.text.heading }}>
                      {r.name}
                    </span>
                    <Badge label={r.badge[0]} tone={r.badge[1]} dot="left" />
                  </div>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    {r.detail}
                  </Text>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
      </>}
    </Shell>
  );
}
