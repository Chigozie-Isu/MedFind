'use client';

import { useState } from 'react';
import { Badge, Button, Text, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { useWorkspace, type ActivityEntry } from '../workspace/store';
import { Avatar, EmptyState, Pager, SearchBox, Skeleton, Tabs, dmyOf, downloadCsv, hhmmOf, useFirstLoad, usePaged } from '../common/ui';
import c from '../common/common.module.css';

type Tab = 'all' | 'reservation' | 'stock';
const COLS = { gridTemplateColumns: '0.6fr 1.6fr 3fr 1.1fr' };

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return `${same(d, now) ? 'Today' : same(d, y) ? 'Yesterday' : d.toLocaleDateString('en-GB', { weekday: 'long' })} · ${dmyOf(iso)}`;
}

/** Activity (Figma 305:2703) with the empty state (597:11273). */
export function Activity() {
  const w = useWorkspace();
  const loading = useFirstLoad('activity');
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const list = [...w.activity].sort((a, b) => b.at.localeCompare(a.at));
  const match = (a: ActivityEntry) => `${a.employee} ${a.text} ${a.statuses.map((x) => x.label).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase());
  const rows = list.filter((a) => (tab === 'all' || a.kind === tab) && match(a));
  const paged = usePaged(rows, `${tab}|${q}`);

  return (
    <Shell
      active="activity"
      heading={
        <div className={c.stack8}>
          <Text variant="h2" as="h1" color={cssVar.text.primary}>
            Activity
          </Text>
          <Text variant="body3" color={cssVar.text.secondary}>
            Who did what, and when. Newest first, kept for 2 years.
          </Text>
        </div>
      }
      actions={
        <Button
          label="Export CSV"
          variant="secondary"
          size="medium"
          iconLeft="upload"
          onPress={() => downloadCsv('fuasi-activity.csv', [['Date', 'Time', 'Employee', 'Role', 'Activity', 'Status'], ...rows.map((a) => [dmyOf(a.at), hhmmOf(a.at), a.employee, a.role, a.text, a.statuses.map((x) => x.label).join(' · ')])])}
        />
      }
    >
      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <div className={c.stack24}>
          <div className={c.toolbar}>
            <Tabs
              tabs={[
                { key: 'all', label: 'All', count: list.length },
                { key: 'reservation', label: 'Reservations', count: list.filter((a) => a.kind === 'reservation').length },
                { key: 'stock', label: 'Stock', count: list.filter((a) => a.kind === 'stock').length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <SearchBox value={q} onChange={setQ} placeholder="Search for medicine, employee or tags" />
          </div>
          <div className={c.tableCard}>
            <div className={`${c.thead} mf-t-caption1`} style={COLS}>
              <span>Time</span>
              <span>Employee</span>
              <span>Activity</span>
              <span>Status</span>
            </div>
            {paged.rows.map((a, i) => {
              const showDay = i === 0 || dayLabel(paged.rows[i - 1].at) !== dayLabel(a.at);
              return (
                <div key={a.id}>
                  {showDay && (
                    <div style={{ padding: '16px 12px' }}>
                      <Text variant="label1" color={cssVar.text.heading}>
                        {dayLabel(a.at)}
                      </Text>
                    </div>
                  )}
                  <div className={c.trow} style={COLS}>
                    <Text variant="label2">{hhmmOf(a.at)}</Text>
                    <div className={c.row8} style={{ gap: 16 }}>
                      <Avatar name={a.employee} size={48} />
                      <div className={c.cellStack}>
                        <Text variant="body1">{a.employee}</Text>
                        <Text variant="caption1" color={cssVar.text.secondary}>
                          {a.role}
                        </Text>
                      </div>
                    </div>
                    <Text variant="label2">{a.text}</Text>
                    <div className={c.badges}>
                      {a.statuses.map((st) => (
                        <Badge key={st.label} label={st.label} tone={st.tone} dot="left" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {paged.total === 0 && (
              <EmptyState
                icon="history"
                title={q ? 'Nothing matches your search' : 'No activity yet'}
                body={q ? `No activity mentions “${q}”. Try a medicine, an employee or a code like AB-433.` : 'When your team confirms reservations or changes stock, it shows up here.'}
                action={q ? <Button label="Clear search" variant="secondary" onPress={() => setQ('')} /> : undefined}
              />
            )}
            <Pager {...paged} />
          </div>
        </div>
      )}
    </Shell>
  );
}
