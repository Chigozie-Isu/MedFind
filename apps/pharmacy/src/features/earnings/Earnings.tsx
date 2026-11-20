'use client';

import { useState } from 'react';
import { commissionKobo, formatNaira, nextPayoutDate } from '@medfind/core';
import { Badge, Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { useNow } from '../reservations/store';
import { useWorkspace, type Transaction } from '../workspace/store';
import { Pager, Skeleton, Tabs, EmptyState, dmyOf, downloadCsv, hhmmOf, useFirstLoad, usePaged } from '../common/ui';
import c from '../common/common.module.css';
import s from './earnings.module.css';

type Tab = 'all' | 'online' | 'counter' | 'payout';
const COLS = { gridTemplateColumns: '1fr 2.4fr 1.4fr 0.9fr 1fr 0.8fr' };

/** Sample week of sales for the chart (Figma "Daily sales"), in kobo. */
const WEEK = [
  { day: 'Tue', online: 3_100_000, counter: 1_400_000 },
  { day: 'Wed', online: 3_900_000, counter: 1_700_000 },
  { day: 'Thu', online: 3_500_000, counter: 1_500_000 },
  { day: 'Fri', online: 4_600_000, counter: 2_100_000 },
  { day: 'Sat', online: 5_100_000, counter: 2_300_000 },
  { day: 'Sun', online: 2_800_000, counter: 1_100_000 },
  { day: 'Mon', online: 3_600_000, counter: 1_700_000 },
];
const MAX = 10_000_000;

/** Sales in this payout period before today (sample), so the totals match Figma. */
const BASE_ONLINE = 21_240_000 - 1_157_000;
const BASE_COUNTER = 9_660_000 - 1_190_000;

function weekDates() {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(`${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

const isOnline = (t: Transaction) => t.method.startsWith('Online');

/** Earnings (Figma 605:24223). Figures are simulated; no money moves. */
export function Earnings() {
  return useNow() ? <EarningsScreen /> : null;
}

function EarningsScreen() {
  const w = useWorkspace();
  const loading = useFirstLoad('earnings');
  const [tab, setTab] = useState<Tab>('all');
  const [hover, setHover] = useState<number | null>(null);
  const sales = w.transactions.filter((t) => t.method !== 'Payout');
  const online = (w.isNewPharmacy ? 0 : BASE_ONLINE) + sales.filter(isOnline).reduce((t, x) => t + x.paidKobo, 0);
  const counter = (w.isNewPharmacy ? 0 : BASE_COUNTER) + sales.filter((x) => x.method === 'Counter').reduce((t, x) => t + x.paidKobo, 0);
  const total = online + counter;
  const fee = commissionKobo(total);
  const payoutDay = new Date(`${nextPayoutDate(new Date())}T12:00:00`);
  const payoutLabel = payoutDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const rows = w.transactions.filter((t) => (tab === 'all' ? true : tab === 'online' ? isOnline(t) : tab === 'counter' ? t.method === 'Counter' : t.method === 'Payout'));
  const paged = usePaged(rows, tab);
  const dates = weekDates();
  const week = (w.isNewPharmacy ? WEEK.map(d => ({ ...d, online: 0, counter: 0 })) : WEEK).map((d, i) => (i === 6 ? { ...d, online: d.online + sales.filter(isOnline).slice(0, 3).reduce((t, x) => t + x.paidKobo, 0) } : d));

  return (
    <Shell
      active="earnings"
      heading={
        <div className={c.stack8}>
          <Text variant="h3" as="h1" color={cssVar.text.heading}>
            Earnings
          </Text>
          <Text variant="body3" color={cssVar.text.secondary}>
            {w.payoutBank ? `Paid every second Friday to ${w.payoutBank} •••• ${w.payoutLast4}` : w.isNewPharmacy ? 'Add your payout account to receive earnings' : 'Paid every second Friday to Sterling Bank •••• 2345'}
          </Text>
        </div>
      }
      actions={
        <Button
          label="Export"
          variant="secondary"
          size="medium"
          iconLeft="upload"
          onPress={() =>
            downloadCsv(`${w.pharmacy.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pharmacy'}-earnings.csv`, [
              ['Date', 'Time', 'Item', 'Payment method', 'Code', 'Paid (NGN)', 'Fee (NGN)'],
              ...rows.map((t) => [dmyOf(t.at), hhmmOf(t.at), t.item, t.method, t.code, t.paidKobo / 100, t.method === 'Payout' ? 0 : commissionKobo(t.paidKobo) / 100]),
            ])
          }
        />
      }
    >
      {loading ? (
        <Skeleton rows={4} cards={3} />
      ) : (
        <div className={c.stack24}>
          <div className={s.top}>
            <div className={s.leftCol}>
              <section className={s.payout}>
                <div className={c.row8}>
                  <Text variant="label2" color={cssVar.text.secondary}>
                    Next payout · {payoutLabel}
                  </Text>
                  <Badge label="Scheduled" tone="info" dot="left" />
                </div>
                <span className="mf-t-h2" style={{ color: cssVar.text.heading }}>
                  {formatNaira(total)}
                </span>
                <div className={c.row8} style={{ gap: 48 }}>
                  <div className={c.stack8}>
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      Fee (5%)
                    </Text>
                    <Text variant="h5" color={cssVar.text.heading}>
                      {formatNaira(fee)}
                    </Text>
                  </div>
                  <div className={c.stack8}>
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      You receive
                    </Text>
                    <Text variant="h5" color={cssVar.text.heading}>
                      {formatNaira(total - fee)}
                    </Text>
                  </div>
                </div>
                <span className={s.payoutIcon}>
                  <Icon name="wallet" size={24} />
                </span>
              </section>
              <div className={c.grid2}>
                <section className={c.panel}>
                  <Text variant="h5" color={cssVar.text.heading}>
                    Online sales
                  </Text>
                  <span className="mf-t-h3" style={{ color: cssVar.text.heading }}>
                    {formatNaira(online)}
                  </span>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    Paid through MedFind · {(w.isNewPharmacy ? 0 : 57) + sales.filter(isOnline).length} orders
                  </Text>
                </section>
                <section className={c.panel}>
                  <Text variant="h5" color={cssVar.text.heading}>
                    Counter sales
                  </Text>
                  <span className="mf-t-h3" style={{ color: cssVar.text.heading }}>
                    {formatNaira(counter)}
                  </span>
                  <Text variant="caption1" color={cssVar.text.secondary}>
                    Marked paid by {w.pharmacy.split(' ')[0]} · {(w.isNewPharmacy ? 0 : 35) + sales.filter((x) => x.method === 'Counter').length} orders
                  </Text>
                </section>
              </div>
            </div>
            <section className={c.panel}>
              <div className={c.between}>
                <Text variant="h4" as="h2" color={cssVar.text.heading}>
                  Daily sales
                </Text>
                <div className={c.row8} style={{ gap: 16 }}>
                  <span className={c.row8}>
                    <span className={s.key} style={{ background: cssVar.brand.default }} />
                    <Text variant="caption1">Online</Text>
                  </span>
                  <span className={c.row8}>
                    <span className={s.key} style={{ background: cssVar.accent }} />
                    <Text variant="caption1">Pharmacy</Text>
                  </span>
                </div>
              </div>
              <div className={s.chart}>
                <div className={s.yAxis}>
                  {['₦100k', '₦80k', '₦60k', '₦40k', '₦20k', '₦0'].map((l) => (
                    <Text key={l} variant="caption2" color={cssVar.text.secondary}>
                      {l}
                    </Text>
                  ))}
                </div>
                <div className={s.bars}>
                  {week.map((d, i) => (
                    <button
                      type="button"
                      key={d.day}
                      className={s.barCol}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${dates[i]}: ${formatNaira(d.online)} online, ${formatNaira(d.counter)} at the counter`}
                    >
                      {hover === i && (
                        <span className={`${s.tip} mf-t-caption2`}>
                          {formatNaira(d.online + d.counter)}
                        </span>
                      )}
                      <span className={s.stack} style={{ height: `${((d.online + d.counter) / MAX) * 100}%` }}>
                        <span style={{ flex: d.counter, background: cssVar.accent }} />
                        <span style={{ flex: d.online, background: cssVar.brand.default }} />
                      </span>
                      <Text variant="caption2" color={cssVar.text.secondary}>
                        {dates[i]}
                      </Text>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <div className={c.toolbar}>
            <Text variant="h4" as="h2" color={cssVar.text.heading}>
              Transactions
            </Text>
            <Tabs
              tabs={[
                { key: 'all', label: 'All', count: w.transactions.length },
                { key: 'online', label: 'Online', count: w.transactions.filter(isOnline).length },
                { key: 'counter', label: 'Counter', count: w.transactions.filter((t) => t.method === 'Counter').length },
                { key: 'payout', label: 'Payout', count: w.transactions.filter((t) => t.method === 'Payout').length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className={c.tableCard}>
            <div className={`${c.thead} mf-t-caption1`} style={COLS}>
              <span>Date and time</span>
              <span>Item</span>
              <span>Payment method</span>
              <span>Code</span>
              <span>Paid</span>
              <span>Fee</span>
            </div>
            {paged.rows.map((t) => (
              <div key={t.id} className={c.trow} style={COLS}>
                <div className={c.cellStack}>
                  <Text variant="caption1">{dmyOf(t.at)}</Text>
                  <Text variant="caption1">{hhmmOf(t.at)}</Text>
                </div>
                <Text variant="body2">{t.item}</Text>
                <span className={c.row8} style={{ color: cssVar.text.secondary }}>
                  <Icon name={t.method === 'Counter' ? 'store' : t.method === 'Payout' ? 'wallet' : 'card'} size={16} />
                  <Text variant="caption1">{t.method}</Text>
                </span>
                <Text variant="caption1">{t.code}</Text>
                <Text variant="h5">{formatNaira(t.paidKobo)}</Text>
                <Text variant="caption1">{t.method === 'Payout' ? '—' : formatNaira(commissionKobo(t.paidKobo))}</Text>
              </div>
            ))}
            {paged.total === 0 && <EmptyState icon="wallet" title="No transactions yet" body="Your transactions will appear here after your first collected reservation." />}
            <Pager {...paged} />
          </div>
          <Text variant="caption1" color={cssVar.text.secondary}>
            Demo figures. No real payments or payouts are made.
          </Text>
        </div>
      )}
    </Shell>
  );
}
