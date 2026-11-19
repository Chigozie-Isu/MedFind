'use client';

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from 'react';
import { Shell } from '../reservations/Shell';
import { useReservations } from '../reservations/store';

export type Section = 'inventory' | 'activity' | 'earnings' | 'profile';
type Item = { id: string; name: string; quantity: number; price: number };
type State = {
  pharmacy: string; staffName: string; address: string; phone: string; opening: string; closing: string;
  accepting: boolean; items: Item[]; events: { id: string; label: string; at: string }[];
};
const KEY = 'medfind-pharmacy-demo-v2';
const initial: State = {
  pharmacy: 'Fuasi Pharmacy', staffName: 'Yusuf Bilal', address: 'Lagos, Nigeria',
  phone: '0803 123 4567', opening: '08:00', closing: '20:00', accepting: true,
  items: [
    { id: 'med-1', name: 'Cetirizine 10mg', quantity: 18, price: 1850 },
    { id: 'med-2', name: 'Amlodipine 5mg', quantity: 0, price: 2100 },
    { id: 'med-3', name: 'Salbutamol inhaler 100mcg', quantity: 2, price: 4900 },
    { id: 'med-4', name: 'Co-amoxiclav 625mg', quantity: 14, price: 3450 },
  ],
  events: [],
};
let state: State = initial;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const emit = () => listeners.forEach((listener) => listener());
const snapshot = () => state;
const serverSnapshot = () => initial;
let hydrated = false;
export function hydrateWorkspace() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<State>;
      state = { ...initial, ...parsed, items: Array.isArray(parsed.items) ? parsed.items : initial.items, events: Array.isArray(parsed.events) ? parsed.events : [] };
    }
  } catch { /* Demo remains usable when storage is unavailable. */ }
  emit();
}
function persist(next: State) {
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* in-memory fallback */ }
  emit();
}
export function updateWorkspace(change: Partial<State>, event?: string) {
  persist({ ...state, ...change, events: event ? [{ id: String(Date.now()), label: event, at: new Date().toISOString() }, ...state.events] : state.events });
}
export function resetWorkspace() {
  persist({ ...initial, items: initial.items.map((i) => ({ ...i })), events: [] });
}
export function useWorkspace() {
  useEffect(() => hydrateWorkspace(), []);
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

const panel: CSSProperties = { background: 'var(--mf-surface-raised)', border: '1px solid var(--mf-surface-border)', borderRadius: 20, padding: 24 };
const field: CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--mf-surface-border)', background: 'var(--mf-surface-default)', color: 'var(--mf-text-primary)', boxSizing: 'border-box' };
const button: CSSProperties = { padding: '10px 18px', borderRadius: 10, border: 0, background: 'var(--mf-brand-default)', color: 'white', cursor: 'pointer', fontWeight: 700 };
const subtle: CSSProperties = { ...button, background: 'var(--mf-surface-muted)', color: 'var(--mf-text-primary)' };
const money = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Workspace({ section }: { section: Section }) {
  const data = useWorkspace();
  const reservations = useReservations();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('1000');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const title = { inventory: 'Inventory', activity: 'Activity', earnings: 'Earnings', profile: 'Profile and hours' }[section];
  const saveItem = (e: FormEvent) => {
    e.preventDefault();
    const quantity = Number(qty), amount = Number(price);
    if (!name.trim() || !Number.isInteger(quantity) || quantity < 0 || !Number.isFinite(amount) || amount < 0) {
      setError('Enter a medicine name, a non-negative whole-number quantity and a valid price.'); return;
    }
    const id = 'med-' + Date.now();
    updateWorkspace({ items: [...data.items, { id, name: name.trim(), quantity, price: amount }] }, 'Added ' + name.trim() + ' to inventory');
    setName(''); setQty('1'); setPrice('1000'); setError('');
  };
  const updateItem = (id: string, change: Partial<Item>) => {
    const item = data.items.find((i) => i.id === id);
    if (!item) return;
    updateWorkspace({ items: data.items.map((i) => i.id === id ? { ...i, ...change } : i) }, 'Updated stock for ' + item.name);
  };
  const collected = reservations.filter((r) => r.status === 'ready');
  const gross = collected.reduce((total, r) => total + r.totalKobo, 0) / 100;
  const allEvents = [
    ...data.events.map((e) => ({ id: e.id, label: e.label, at: new Date(e.at) })),
    ...reservations.map((r) => ({ id: r.id, label: r.customerName + ' · ' + r.medicineName + ' · ' + r.status, at: r.placedAt })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <Shell active={section} heading={<h1 style={{ margin: 0, color: 'var(--mf-text-heading)' }}>{title}</h1>}>
      {section === 'inventory' && <>
        <section style={panel}>
          <h2>Medicine stock</h2>
          <p>Changes to quantity and price are saved in this browser for the demo.</p>
          <input aria-label="Search inventory" placeholder="Search medicines" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...field, maxWidth: 420 }} />
          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            {data.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).map((i) =>
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--mf-surface-border)', paddingBottom: 12 }}>
                <div><strong>{i.name}</strong><div>{i.quantity === 0 ? 'Out of stock' : i.quantity <= 3 ? 'Low stock' : 'In stock'} · {money(i.price)}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={subtle} onClick={() => updateItem(i.id, { quantity: Math.max(0, i.quantity - 1) })} aria-label={'Reduce ' + i.name}>−</button>
                  <span>{i.quantity}</span>
                  <button style={subtle} onClick={() => updateItem(i.id, { quantity: i.quantity + 1 })} aria-label={'Restock ' + i.name}>+</button>
                  <button style={subtle} onClick={() => { if (window.confirm('Remove ' + i.name + '?')) updateWorkspace({ items: data.items.filter((x) => x.id !== i.id) }, 'Removed ' + i.name); }}>Remove</button>
                </div>
              </div>)}
            {data.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).length === 0 && <p>No medicines match your search.</p>}
          </div>
        </section>
        <form onSubmit={saveItem} style={{ ...panel, display: 'grid', gap: 12, maxWidth: 600 }}>
          <h2 style={{ margin: 0 }}>Add medicine</h2>
          <label>Medicine name<input style={field} value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Quantity<input style={field} type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required /></label>
          <label>Price (₦)<input style={field} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
          {error && <p role="alert">{error}</p>}
          <button style={button} type="submit">Add to inventory</button>
        </form>
      </>}
      {section === 'activity' && <section style={panel}>
        <h2>Recent activity</h2>
        {allEvents.length === 0 ? <p>No activity yet. Try editing inventory or reviewing a reservation.</p> :
          allEvents.map((e) => <div key={e.id} style={{ borderBottom: '1px solid var(--mf-surface-border)', padding: '14px 0' }}><strong>{e.label}</strong><div>{e.at.toLocaleString('en-NG')}</div></div>)}
      </section>}
      {section === 'earnings' && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={panel}><h2>Confirmed reservation value</h2><strong style={{ fontSize: 28 }}>{money(gross)}</strong></div>
          <div style={panel}><h2>Estimated MedFind fee (5%)</h2><strong style={{ fontSize: 28 }}>{money(gross * .05)}</strong></div>
          <div style={panel}><h2>Estimated pharmacy proceeds</h2><strong style={{ fontSize: 28 }}>{money(gross * .95)}</strong></div>
        </div>
        <section style={panel}><h2>Reservation breakdown</h2><p>Illustrative figures only. No payments or payouts are made.</p>
          {collected.length === 0 ? <p>No confirmed reservations yet.</p> : collected.map((r) => <div key={r.id} style={{ padding: 12, borderBottom: '1px solid var(--mf-surface-border)' }}>{r.ref} · {r.medicineName} · {money(r.totalKobo / 100)}</div>)}
        </section>
      </>}
      {section === 'profile' && <form style={{ ...panel, display: 'grid', gap: 16, maxWidth: 680 }} onSubmit={(e) => { e.preventDefault(); setSaved(true); updateWorkspace({}, 'Updated pharmacy profile'); }}>
        <h2 style={{ margin: 0 }}>Business details</h2>
        {([
          ['pharmacy', 'Pharmacy name'], ['staffName', 'Staff display name'], ['address', 'Address'], ['phone', 'Phone number'],
          ['opening', 'Opening time'], ['closing', 'Closing time'],
        ] as const).map(([key, label]) =>
          <label key={key} style={{ display: 'grid', gap: 6 }}>{label}
            <input style={field} type={key === 'opening' || key === 'closing' ? 'time' : 'text'} required value={data[key]}
              onChange={(e) => { setSaved(false); updateWorkspace({ [key]: e.target.value }); }} />
          </label>)}
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="checkbox" checked={data.accepting} onChange={(e) => updateWorkspace({ accepting: e.target.checked }, e.target.checked ? 'Started taking reservations' : 'Paused reservations')} />
          Taking reservations
        </label>
        <button style={button} type="submit">Save changes</button>
        {saved && <p role="status">Profile saved. Your changes are reflected in the navigation.</p>}
        <button type="button" style={subtle} onClick={() => { if (window.confirm('Reset all pharmacy demo settings and inventory?')) { resetWorkspace(); setSaved(false); } }}>Reset pharmacy demo</button>
      </form>}
    </Shell>
  );
}
