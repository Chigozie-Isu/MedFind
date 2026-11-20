'use client';

/**
 * Reservations for the pharmacy demo (Fuasi Pharmacy, staff Yusuf Bilal).
 * Grace's reservations arrive live from the customer app over a Supabase Realtime
 * broadcast channel, and Approve / Decline / Picked up go back the same way, so her
 * Pickup code screen changes straight away. The other cards are the sample orders drawn
 * in Figma: Bob (OTC pickup), Ned (prescription delivery), Kemi (OTC delivery, arrives a
 * few seconds after the app opens), Annie and Tunde (ready for pickup).
 * Riders and deliveries are simulated: nothing is really sent anywhere.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  DEMO_CHANNEL,
  DEMO_EVENTS,
  DELIVERY_FEE_KOBO,
  approvalMsLeft,
  formatNaira,
  isApprovalExpired,
  type DemoApprovedPayload,
  type DemoDeclinedPayload,
  type DemoPlacedPayload,
  type Fulfilment,
  type OrderKind,
} from '@medfind/core';
import { supabase } from '../../lib/supabase';
import { addTransaction, getWorkspace, logActivity, updateWorkspace } from '../workspace/store';
import { notify } from '../common/ui';

export const staff = { name: 'Yusuf Bilal', firstName: 'Yusuf', code: '5K-348', pharmacy: 'Fuasi Pharmacy' };

/** Event names the customer app thread agreed for the next demoChannel change. */
const COLLECTED_EVENT = (DEMO_EVENTS as Record<string, string>).collected ?? 'reservation_collected';
const CANCELLED_EVENT = (DEMO_EVENTS as Record<string, string>).cancelled ?? 'reservation_cancelled';

export type PharmacyStatus = 'review' | 'ready' | 'out' | 'collected' | 'delivered' | 'declined' | 'expired' | 'cancelled';
export type Payment = 'online' | 'counter';

export const RIDER = { name: 'Musa Ibrahim', first: 'Musa', plate: 'RIV 482 KJ', bike: 'Honda bike', phone: '+234 803 412 7781', code: '482 913' };

export interface PharmacyReservation {
  id: string;
  ref: string;
  customerName: string;
  /** 'he' or 'she', from the Figma copy ("Ned has been told his order…"). */
  pronoun: 'he' | 'she';
  medicineName: string;
  quantity: number;
  unit: string;
  fulfilment: Fulfilment;
  kind: OrderKind;
  payment: Payment;
  totalKobo: number;
  placedAt: Date;
  pickupCode: string;
  status: PharmacyStatus;
  address?: string;
  patient?: string;
  readyAt?: Date;
  outAt?: Date;
  doneAt?: Date;
  approvedBy?: string;
  declineReason?: string;
  /** True for orders that came from the customer app (Grace), false for Figma samples. */
  live: boolean;
}

const min = 60_000;

interface SampleInit extends Partial<PharmacyReservation> {
  id: string;
  customerName: string;
  medicineName: string;
  naira: number;
  minutesAgo: number;
}

function sample(init: SampleInit, loadedAt: number): PharmacyReservation {
  const placedAt = new Date(loadedAt - init.minutesAgo * min);
  const status = init.status ?? 'review';
  return {
    ref: init.id.toUpperCase(),
    pronoun: 'she',
    quantity: 1,
    unit: '',
    fulfilment: 'pickup',
    kind: 'otc',
    payment: 'online',
    pickupCode: '',
    live: false,
    ...init,
    status,
    totalKobo: init.naira * 100,
    placedAt,
    readyAt: status === 'ready' ? (init.readyAt ?? placedAt) : undefined,
  };
}

const GRACE_SAMPLE: SampleInit = {
  id: 'ab-145', customerName: 'Grace Mary', medicineName: 'Augmentin suspension 228 mg/5 ml', unit: 'bottle', kind: 'prescription',
  payment: 'counter', naira: 3450, minutesAgo: 0.2, pickupCode: '482915', patient: 'for her son Prince, 6 years',
};

function initialReservations(): PharmacyReservation[] {
  const now = Date.now();
  const list: SampleInit[] = [
    { id: 'ab-151', customerName: 'Bob Mackie', pronoun: 'he', medicineName: 'Cetirizine 5mg', quantity: 2, payment: 'counter', naira: 3700, minutesAgo: 6.8 },
    {
      id: 'ab-146', customerName: 'Ned Mackie', pronoun: 'he', medicineName: 'Augmentin suspension 228 mg/5 ml', unit: 'bottle', kind: 'prescription',
      fulfilment: 'delivery', naira: 4450, minutesAgo: 1.5, address: '24 Aba Road, Port Harcourt · 1.8 km away', patient: 'for his son Prince, 6 years',
    },
    { id: 'ab-123', customerName: 'Annie Oak', medicineName: 'Loratadine 10mg', naira: 1350, minutesAgo: 30, status: 'ready', readyAt: new Date(now - 10 * min) },
    { id: 'ab-789', customerName: 'Tunde Yomi', pronoun: 'he', medicineName: 'Loratadine 10mg', naira: 1350, minutesAgo: 100, status: 'ready', readyAt: new Date(now - 90 * min) },
  ];
  // Without Supabase settings there is no live Grace, so show her Figma sample to keep the screens viewable.
  if (!supabase) list.unshift(GRACE_SAMPLE);
  return list.map((x) => sample(x, now));
}

const KEMI: SampleInit = {
  id: 'ab-152', customerName: 'Kemi Ade', medicineName: 'Cetirizine 5 mg', quantity: 2, unit: 'packs', fulfilment: 'delivery',
  naira: 4700, minutesAgo: 0, address: '9 Woji Road, Port Harcourt · 2.4 km away',
};

let reservations: PharmacyReservation[] = initialReservations();
const NEW_RESERVATIONS_KEY = 'medfind.pharmacy.reservations.fresh.v1';
function isFreshPharmacy() {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(NEW_RESERVATIONS_KEY) === '1'; } catch { return false; }
}
/** A single clearly simulated incoming order after demo verification. */
export function scheduleNewPharmacyDemoReservation() {
  if (typeof window === 'undefined') return;
  const key = 'medfind.pharmacy.demo.incoming.v1';
  {
    const medicine = getWorkspace().items[0];
    const r = sample({ id: 'demo-new-001', customerName: 'Ada Okafor', medicineName: medicine?.brand || 'Paracetamol 500 mg', quantity: 1, naira: medicine ? medicine.priceKobo / 100 : 1500, minutesAgo: 0, payment: 'counter' }, Date.now());
    if (reservations.some(x => x.id === r.id)) return;
    reservations = [r, ...reservations];
    emit();
    announce(r);
    notify('New demo reservation', 'Ada Okafor has placed a reservation for review.');
  }
}

export function startNewPharmacyReservations() {
  try { window.localStorage.setItem(NEW_RESERVATIONS_KEY, '1'); } catch { /* memory only */ }
  reservations = [];
  today = [];
  todayCount = 0;
  incoming = null;
  emit();
}
if (isFreshPharmacy()) reservations = [];

/** Recent lines for "Activity today" on the board (Figma 196:3840). */
export interface TodayLine {
  name: string;
  detail: string;
  label: string;
  tone: 'success' | 'warning' | 'error' | 'info';
}
const SEED_TODAY: TodayLine[] = [
  { name: 'Grace Bello', detail: 'Losartan 50mg . 18:00', label: 'Confirmed', tone: 'success' },
  { name: 'Amos Gandu', detail: 'Lisinopril 5mg . 15:00', label: 'Collected', tone: 'success' },
  { name: 'James Adjei', detail: 'Atorvastatin 20mg . 14:30', label: 'Rejected', tone: 'warning' },
  { name: 'Sarah Mensah', detail: 'Amlodipine 5mg . 14:00', label: 'Collected', tone: 'success' },
  { name: 'Daniel Okoro', detail: 'Metformin 500mg . 12:00', label: 'Expired', tone: 'error' },
];
let today: TodayLine[] = isFreshPharmacy() ? [] : SEED_TODAY;
let todayCount = isFreshPharmacy() ? 0 : 25;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let channel: RealtimeChannel | null = null;

function connect(): void {
  if (!supabase || channel) return;
  channel = supabase
    .channel(DEMO_CHANNEL)
    .on('broadcast', { event: DEMO_EVENTS.placed }, ({ payload }) => {
      const p = payload as DemoPlacedPayload & { paymentMethod?: string };
      if (reservations.some((r) => r.id === p.id)) return;
      reservations = [
        {
          ...p,
          placedAt: new Date(p.placedAt),
          status: 'review',
          live: true,
          pronoun: 'she',
          unit: p.kind === 'prescription' ? 'bottle' : '',
          payment: !p.paymentMethod || p.paymentMethod === 'pharmacy' ? 'counter' : 'online',
          patient: p.kind === 'prescription' ? 'for her son Prince, 6 years' : undefined,
        },
        ...reservations,
      ];
      emit();
      announce(reservations[0]);
    })
    .on('broadcast', { event: CANCELLED_EVENT }, ({ payload }) => {
      const p = payload as { id: string; reason?: string };
      const r = reservations.find((x) => x.id === p.id);
      if (!r) return;
      update(p.id, { status: 'cancelled', doneAt: new Date() });
      pushToday(r, 'Cancelled', 'error');
      logActivity({ kind: 'reservation', text: `${r.customerName} cancelled ${r.ref}${p.reason ? ` · Reason: ${p.reason}` : ''}`, statuses: [{ label: 'Cancelled', tone: 'error' }] });
      notify('Reservation cancelled', `${r.customerName} cancelled ${r.ref}.${p.reason ? ` Reason: ${p.reason}` : ' The medicine goes back into stock.'}`, 'error');
    })
    .subscribe((status) => {
      // Ask the customer app for anything placed before this page opened.
      if (status === 'SUBSCRIBED') send(DEMO_EVENTS.sync, {});
    });
}

function send(event: string, payload: object): void {
  channel?.send({ type: 'broadcast', event, payload });
}

function update(id: string, change: Partial<PharmacyReservation>): void {
  reservations = reservations.map((r) => (r.id === id ? { ...r, ...change } : r));
  emit();
}

const find = (id: string) => reservations.find((x) => x.id === id);
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const shortMed = (r: PharmacyReservation) => r.medicineName.replace(' suspension', '').replace(/ 228 mg\/5 ml/, ' 228mg');

function pushToday(r: PharmacyReservation, label: string, tone: TodayLine['tone']) {
  today = [{ name: r.customerName, detail: `${shortMed(r)} . ${hm(new Date())}`, label, tone }, ...today];
  todayCount += 1;
  emit();
}

/** New-reservation popup (Figma "Overlay – new reservation toast"). Set by `announce`. */
let incoming: PharmacyReservation | null = null;
function announce(r: PharmacyReservation) {
  incoming = r;
  emit();
  setTimeout(() => {
    if (incoming?.id === r.id) {
      incoming = null;
      emit();
    }
  }, 9000);
}
export function dismissIncoming() {
  incoming = null;
  emit();
}

export function approve(id: string): void {
  const readyAt = new Date();
  update(id, { status: 'ready', readyAt, approvedBy: getWorkspace().staffName });
  const r = find(id)!;
  pushToday(r, 'Confirmed', 'success');
  logActivity({
    kind: 'reservation',
    text: `Accepted ${r.ref} · ${r.medicineName} × ${r.quantity}${r.kind === 'prescription' ? ' · prescription checked' : ''}`,
    statuses: [{ label: 'Accepted', tone: 'success' }],
  });
  if (r.live) send(DEMO_EVENTS.approved, { id, readyAt: readyAt.toISOString(), approvedBy: getWorkspace().staffName } satisfies DemoApprovedPayload);
}

export function decline(id: string, reason: string): void {
  update(id, { status: 'declined', declineReason: reason.trim(), doneAt: new Date() });
  const r = find(id)!;
  pushToday(r, 'Declined', 'error');
  logActivity({ kind: 'reservation', text: `Declined ${r.ref} · ${r.medicineName} × ${r.quantity} · “${reason.trim()}”`, statuses: [{ label: 'Declined', tone: 'error' }] });
  notify('Reservation declined', `${r.ref} · ${r.customerName}. Reason: ${reason.trim()}. The customer will see the decline reason.`, 'error');
  if (r.live) send(DEMO_EVENTS.declined, { id, reason: reason.trim() } satisfies DemoDeclinedPayload);
}

/** Pickup order handed over at the counter (Figma "Overlay – order collected"). */
export function markCollected(id: string): void {
  const doneAt = new Date();
  update(id, { status: 'collected', doneAt });
  const r = find(id)!;
  pushToday(r, 'Collected', 'success');
  const statuses: { label: string; tone: 'success' | 'info' }[] = [{ label: 'Collected', tone: 'success' }];
  if (r.payment === 'counter') statuses.push({ label: 'Paid at counter', tone: 'info' });
  logActivity({ kind: 'reservation', text: `Handed over and Marked ${r.ref} ${r.payment === 'counter' ? 'paid' : 'picked up'} · ${r.medicineName} × ${r.quantity} · code checked`, statuses });
  addTransaction({ item: `${r.medicineName} × ${r.quantity}`, method: r.payment === 'counter' ? 'Counter' : 'Online · Card', code: r.ref, paidKobo: r.totalKobo });
  updateWorkspace((w) => ({ items: w.items.map((i) => (r.medicineName.toLowerCase().startsWith(i.brand.toLowerCase()) ? { ...i, quantity: Math.max(0, i.quantity - r.quantity) } : i)) }));
  notify('Marked as collected', 'The code matched and the order is complete. It moves to Activity today.');
  if (r.live) send(COLLECTED_EVENT, { id, collectedAt: doneAt.toISOString() });
}

const DELIVERY_MS = 30_000;
/** Rider took the bag (Figma "Reservations – Ned out for delivery"). Delivery finishes on its own. */
export function handOver(id: string): void {
  update(id, { status: 'out', outAt: new Date() });
  const r = find(id)!;
  logActivity({ kind: 'reservation', text: `Handed over ${r.ref} to rider ${RIDER.name} · ${r.medicineName} × ${r.quantity} · rider code checked`, statuses: [{ label: 'Out for delivery', tone: 'info' }] });
  setTimeout(() => markDelivered(id), DELIVERY_MS);
}

export function markDelivered(id: string): void {
  const r = find(id);
  if (!r || r.status !== 'out') return;
  const doneAt = new Date();
  update(id, { status: 'delivered', doneAt });
  pushToday(r, 'Delivered', 'success');
  logActivity({ kind: 'reservation', text: `${RIDER.first} delivered ${r.ref} to ${r.customerName} · delivery code matched`, statuses: [{ label: 'Delivered', tone: 'success' }] });
  addTransaction({ item: `${r.medicineName} × ${r.quantity}`, method: 'Online · Card', code: r.ref, paidKobo: r.totalKobo });
  notify(
    `Delivered to ${r.customerName} · ${r.ref}`,
    `${RIDER.first} entered ${firstName(r.customerName)}’s delivery code at ${hm(doneAt)}, so the order is complete. ${formatNaira(r.totalKobo - DELIVERY_FEE_KOBO)} goes into your next payout, every second Friday.`,
  );
  if (r.live) send(COLLECTED_EVENT, { id, collectedAt: doneAt.toISOString() });
}

/** Minutes until the rider arrives, for "Rider arriving in 6 mins". */
export function riderEta(r: PharmacyReservation, now: number): number {
  if (!r.readyAt) return 0;
  return Math.max(0, Math.ceil((r.readyAt.getTime() + 8 * min - now) / min));
}

let timersStarted = false;
function startTimers() {
  if (timersStarted || typeof window === 'undefined') return;
  timersStarted = true;
  connect();
  // Kemi's OTC delivery order arrives a little after the app opens (Figma "Overlay – new reservation toast").
  setTimeout(() => {
    if (isFreshPharmacy() || reservations.some((r) => r.id === KEMI.id)) return;
    const k = sample(KEMI, Date.now());
    reservations = [...reservations, k];
    emit();
    announce(k);
  }, 12_000);
  // Unanswered reservations expire after the approval window (rule in @medfind/core).
  setInterval(() => {
    const now = new Date();
    const expiring = reservations.filter((r) => r.status === 'review' && isApprovalExpired(r.placedAt, now));
    if (!expiring.length) return;
    reservations = reservations.map((r) => (expiring.includes(r) ? { ...r, status: 'expired', doneAt: now } : r));
    expiring.forEach((r) => pushToday(r, 'Expired', 'error'));
    emit();
  }, 1000);
}

/** Puts every reservation back to how the demo starts (Profile › Reset demo). */
export function resetReservations() {
  reservations = isFreshPharmacy() ? [] : initialReservations();
  today = isFreshPharmacy() ? [] : SEED_TODAY;
  todayCount = isFreshPharmacy() ? 0 : 25;
  incoming = null;
  emit();
}

if (typeof window !== 'undefined') startTimers();

const EMPTY: PharmacyReservation[] = [];
const getServer = () => EMPTY;

export function useReservations(): PharmacyReservation[] {
  return useSyncExternalStore(subscribe, () => reservations, getServer);
}

export function useReservation(id: string): PharmacyReservation | undefined {
  return useReservations().find((r) => r.id === id);
}

export function useToday(): { lines: TodayLine[]; count: number } {
  const lines = useSyncExternalStore(subscribe, () => today, () => []);
  const count = useSyncExternalStore(subscribe, () => todayCount, () => 0);
  return { lines, count };
}

export function useIncoming(): PharmacyReservation | null {
  return useSyncExternalStore(subscribe, () => incoming, () => null);
}

/** Re-renders every second, for countdowns. 0 until mounted (the screens render in the browser only). */
export function useNow(): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export const minutesLeftToReply = (r: PharmacyReservation, now: number) => approvalMsLeft(r.placedAt, new Date(now));

const pad = (n: number) => String(n).padStart(2, '0');

/** "09:50" (mm:ss) or "01:50:09" (hh:mm:ss). */
export function clock(ms: number, withHours = false): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const parts = withHours ? [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60] : [Math.floor(s / 60), s % 60];
  return parts.map(pad).join(':');
}

export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const firstName = (name: string) => name.split(' ')[0];
export const his = (r: PharmacyReservation) => (r.pronoun === 'he' ? 'his' : 'her');

export function paymentBadge(r: PharmacyReservation): string {
  if (r.fulfilment === 'delivery') return `Delivery · ${formatNaira(r.totalKobo)}${r.status === 'review' ? ' paid' : ''}`;
  return r.payment === 'counter' ? `Pay in person · ${formatNaira(r.totalKobo)}` : `Paid online · ${formatNaira(r.totalKobo)}`;
}
