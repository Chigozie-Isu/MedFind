'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAYOUT_INTERVAL_DAYS, nextPayoutDate } from '@medfind/core';
import { Badge, Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { useWorkspace } from '../workspace/store';
import { Avatar, EmptyState, PageHeading, Pager, Skeleton, Tabs, dmyOf, downloadCsv, useFirstLoad, usePaged } from '../common/ui';
import c from '../common/common.module.css';

const COLS = { gridTemplateColumns: '1fr 2fr 1fr 0.9fr 0.9fr 1fr 1fr' };
const DAY = 86_400_000;

/** The payout period (two weeks ending the day before the next payout), shifted by `offset` periods. */
function period(offset: number) {
  const next = new Date(`${nextPayoutDate(new Date())}T12:00:00`).getTime();
  const end = next - DAY + offset * PAYOUT_INTERVAL_DAYS * DAY;
  const start = end - (PAYOUT_INTERVAL_DAYS - 1) * DAY;
  const f = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return { start, end, label: `${offset === 0 ? 'This payout period' : offset === -1 ? 'Last payout period' : 'Earlier period'} · ${f(start)} – ${f(end)}` };
}

/** Shift history (Figma 601:16828) with the empty state (608:25790). */
export function Shifts() {
  const router = useRouter();
  const w = useWorkspace();
  const loading = useFirstLoad('shifts');
  const [offset, setOffset] = useState(0);
  const [who, setWho] = useState('all');
  const p = period(offset);
  const inPeriod = w.shifts.filter((s) => {
    const t = new Date(`${s.day}T12:00:00`).getTime();
    return t >= p.start - DAY && t <= p.end + DAY;
  });
  const people = [...new Set(w.shifts.map((s) => s.employee))];
  const rows = inPeriod.filter((s) => who === 'all' || s.employee === who);
  const paged = usePaged(rows, `${offset}|${who}`);

  return (
    <Shell
      active="profile"
      heading={<PageHeading title="Shift history" subtitle="Every clock-in and clock-out, by staff code. Kept for 2 years." crumbs={{ label: 'Profile and hours', href: '/profile' }} />}
      actions={
        <>
          <Button label="Export" variant="secondary" size="medium" iconLeft="upload" onPress={() => downloadCsv('fuasi-shifts.csv', [['Day', 'Employee', 'Reservations', 'Opening', 'Closing', 'Hours', 'Status'], ...rows.map((s) => [dmyOf(s.day), s.employee, s.reservations, s.opening, s.closing, s.hours, s.complete ? 'Complete' : 'Incomplete'])])} />
          <Button label="Add employees" size="medium" iconLeft="add" onPress={() => router.push('/profile/employees?add=1')} />
        </>
      }
    >
      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <div className={c.stack24}>
          <div className={c.row8} style={{ gap: 24, flexWrap: 'wrap' }}>
            <div className={c.row8} style={{ border: `1px solid ${cssVar.text.heading}`, borderRadius: 24, padding: '8px 12px', gap: 16 }}>
              <button type="button" className={c.linkBtn} style={{ color: cssVar.text.heading }} onClick={() => setOffset((o) => o - 1)} aria-label="Earlier period">
                <Icon name="chevron-left" size={16} />
              </button>
              <Text variant="label1" color={cssVar.text.heading}>
                {p.label}
              </Text>
              <button type="button" className={c.linkBtn} style={{ color: cssVar.text.heading, opacity: offset === 0 ? 0.4 : 1 }} disabled={offset === 0} onClick={() => setOffset((o) => Math.min(0, o + 1))} aria-label="Later period">
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
            <Tabs
              tabs={[{ key: 'all', label: 'All', count: inPeriod.length }, ...people.map((n) => ({ key: n, label: n.split(' ')[0], count: inPeriod.filter((s) => s.employee === n).length }))]}
              value={who}
              onChange={setWho}
            />
          </div>
          <div className={c.tableCard}>
            <div className={`${c.thead} mf-t-caption1`} style={COLS}>
              <span>Day</span>
              <span>Employee</span>
              <span>Reservations</span>
              <span>Opening</span>
              <span>Closing</span>
              <span>Hours</span>
              <span>Status</span>
            </div>
            {paged.rows.map((s) => (
              <div key={s.id} className={c.trow} style={COLS}>
                <Text variant="caption1">{dmyOf(s.day)}</Text>
                <span className={c.row8} style={{ gap: 16 }}>
                  <Avatar name={s.employee} size={48} />
                  <Text variant="body1">{s.employee}</Text>
                </span>
                <Text variant="body2">{s.reservations}</Text>
                <Text variant="body2">{s.opening}</Text>
                <Text variant="body2">{s.closing}</Text>
                <Text variant="body2">{s.hours}</Text>
                <span>
                  <Badge label={s.complete ? 'Complete' : 'Incomplete'} tone={s.complete ? 'success' : 'error'} dot="left" />
                </span>
              </div>
            ))}
            {paged.total === 0 && <EmptyState icon="time-circle" title="No shifts in this period" body="When your team clocks in with their staff codes, their shifts show up here." />}
            <Pager {...paged} />
          </div>
        </div>
      )}
    </Shell>
  );
}
