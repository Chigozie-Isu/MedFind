'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatNaira } from '@medfind/core';
import { Badge, Button, Icon, Text, cssVar } from '@medfind/ui/web';
import { Shell } from '../reservations/Shell';
import { stockStatus, updateWorkspace, useWorkspace, type StockItem } from '../workspace/store';
import { EmptyState, Pager, SearchBox, Skeleton, Tabs, dmyOf, notify, useFirstLoad, usePaged } from '../common/ui';
import c from '../common/common.module.css';

type Tab = 'all' | 'low' | 'rx' | 'out';
const COLS = { gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.3fr 1.4fr' };
const STATUS = { in: ['In stock', 'success'], low: ['Low stock', 'warning'], out: ['Out of stock', 'error'] } as const;

/** Inventory (Figma 408:5617), with the empty (410:7128) and loading frames. */
export function Inventory() {
  const router = useRouter();
  const params = useSearchParams();
  const w = useWorkspace();
  const loading = useFirstLoad('inventory');
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'all');
  const [q, setQ] = useState('');
  const [adds, setAdds] = useState<Record<string, number>>({});
  const items = w.items;
  const match = (i: StockItem) => `${i.brand} ${i.generic} ${i.dosage}`.toLowerCase().includes(q.trim().toLowerCase());
  const byTab: Record<Tab, (i: StockItem) => boolean> = {
    all: () => true,
    low: (i) => stockStatus(i) === 'low',
    rx: (i) => i.prescription,
    out: (i) => stockStatus(i) === 'out',
  };
  const rows = items.filter((i) => byTab[tab](i) && match(i));
  const paged = usePaged(rows, `${tab}|${q}`);
  const pending = Object.entries(adds).filter(([, n]) => n !== 0);
  const setAdd = (id: string, n: number) => setAdds((a) => ({ ...a, [id]: n }));

  const saveAdds = () => {
    const total = pending.reduce((t, [, n]) => t + n, 0);
    updateWorkspace(
      (s) => ({
        items: s.items.map((i) => (adds[i.id] ? { ...i, quantity: Math.max(0, i.quantity + adds[i.id]), updatedAt: new Date().toISOString().slice(0, 10), updatedBy: s.staffName } : i)),
      }),
      { kind: 'stock', text: `Updated stock for ${pending.length} medicine${pending.length === 1 ? '' : 's'} (${total >= 0 ? '+' : ''}${total} units)`, statuses: [{ label: 'Stock edited', tone: 'info' }] },
    );
    setAdds({});
    notify('Stock updated', 'Patients nearby see the new quantities straight away.');
  };

  return (
    <Shell
      active="inventory"
      heading={
        <div className={c.stack8}>
          <Text variant="h2" as="h1" color={cssVar.text.primary}>
            Inventory
          </Text>
          <Text variant="body3" color={cssVar.text.secondary}>
            {items.length} medications · Last synced just now
          </Text>
        </div>
      }
      actions={
        <>
          <Button label="Add stock" variant="secondary" size="small" iconLeft="add" onPress={() => router.push('/inventory/add')} />
          <Button label="Bulk add" size="small" iconLeft="add" onPress={() => router.push('/inventory/bulk')} />
        </>
      }
    >
      {loading ? (
        <Skeleton rows={5} />
      ) : items.length === 0 ? (
        <NewInventory />
      ) : (
        <div className={c.stack24}>
          <div className={c.toolbar}>
            <Tabs
              tabs={[
                { key: 'all', label: 'All', count: items.length },
                { key: 'low', label: 'Low stock', count: items.filter(byTab.low).length },
                { key: 'rx', label: 'Prescription', count: items.filter(byTab.rx).length },
                { key: 'out', label: 'Out of stock', count: items.filter(byTab.out).length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <SearchBox value={q} onChange={setQ} placeholder="Search for medicine" />
          </div>
          <div className={c.tableCard}>
            <div className={`${c.thead} mf-t-body1`} style={{ ...COLS, textTransform: 'none' }}>
              <span>Medicine</span>
              <span>Quantity</span>
              <span>Price</span>
              <span>Status</span>
              <span>Add</span>
              <span>Last updated</span>
            </div>
            {paged.rows.map((i) => {
              const st = STATUS[stockStatus(i)];
              const add = adds[i.id] ?? 0;
              return (
                <div key={i.id} className={c.trow} style={COLS}>
                  <div className={c.cellStack}>
                    <span>
                      <Text variant="body1">{i.brand} </Text>
                      {i.prescription && (
                        <Text variant="caption1" color={cssVar.text.required}>
                          Rx
                        </Text>
                      )}
                    </span>
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      {i.dosage} . {i.pack}
                    </Text>
                  </div>
                  <Text variant="body2">{String(i.quantity).padStart(4, '0')}</Text>
                  <Text variant="body1">{formatNaira(i.priceKobo)}</Text>
                  <span>
                    <Badge label={st[0]} tone={st[1]} />
                  </span>
                  <span className={c.stepper}>
                    <button type="button" aria-label={`Remove one ${i.brand}`} onClick={() => setAdd(i.id, Math.max(-i.quantity, add - 1))}>
                      <Icon name="minus" size={16} />
                    </button>
                    <input
                      className="mf-t-label2"
                      aria-label={`Units of ${i.brand} to add`}
                      value={add}
                      inputMode="numeric"
                      onChange={(e) => setAdd(i.id, Math.max(-i.quantity, Number(e.target.value.replace(/[^\d-]/g, '')) || 0))}
                    />
                    <button type="button" aria-label={`Add one ${i.brand}`} onClick={() => setAdd(i.id, add + 1)}>
                      <Icon name="add" size={16} />
                    </button>
                  </span>
                  <div className={c.cellStack}>
                    <Text variant="body1">{dmyOf(i.updatedAt)}</Text>
                    <Text variant="caption1" color={cssVar.text.secondary}>
                      {i.updatedBy}
                    </Text>
                  </div>
                </div>
              );
            })}
            {paged.total === 0 && (
              <EmptyState
                icon="search"
                title="No medicines match"
                body={q ? `Nothing in this list matches “${q}”. Check the spelling or add it to your stock.` : 'Nothing in this list right now.'}
                action={<Button label="Add medicine" variant="secondary" iconLeft="add" onPress={() => router.push('/inventory/add')} />}
              />
            )}
            <Pager {...paged} />
          </div>
          {pending.length > 0 && (
            <div className={c.saveBar}>
              <Text variant="body2" color={cssVar.text.heading}>
                {pending.length} change{pending.length === 1 ? '' : 's'} not saved yet
              </Text>
              <div className={c.row8}>
                <Button label="Discard" variant="inline" size="medium" onPress={() => setAdds({})} />
                <Button label="Save stock" size="medium" onPress={saveAdds} />
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

/** "Inventory – empty" (Figma 410:7128): three ways to add stock. */
function NewInventory() {
  const router = useRouter();
  const ways = [
    { title: 'Add one at a time', body: 'Search the medicine catalogue, then add your price, quantity and expiry date.', label: 'Add manually', href: '/inventory/add' },
    { title: 'Add in bulk', body: 'Take photos of packs or whole shelves. We read the names and strengths.', label: 'Upload photo', href: '/inventory/bulk' },
  ];
  return (
    <div className={c.panel}>
      <EmptyState icon="box" title="Your inventory is empty" body="Add what you have in stock so patients nearby can find it. Nothing is shown to patients until you’re live, and you can change quantities any time." />
      <div className={c.grid2}>
        {ways.map((wy) => (
          <div key={wy.title} className={c.panel} style={{ background: cssVar.surface.default }}>
            <Text variant="h5" color={cssVar.text.heading}>
              {wy.title}
            </Text>
            <Text variant="body3" color={cssVar.text.secondary}>
              {wy.body}
            </Text>
            <div>
              <Button label={wy.label} variant="secondary" size="medium" onPress={() => router.push(wy.href)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
