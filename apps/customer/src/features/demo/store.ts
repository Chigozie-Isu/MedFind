/**
 * In-memory reservations for the demo flow. The real app calls `place_reservation`;
 * here a reservation is kept on the phone until the app restarts.
 *
 * The pharmacy app hears about a new reservation, and answers it, over a Supabase
 * Realtime broadcast channel (see `@medfind/core` demoChannel). Without Supabase
 * settings the demo falls back to confirming after a few seconds.
 */
import { useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  DEMO_CHANNEL,
  DEMO_EVENTS,
  PICKUP_CODE_LENGTH,
  isApprovalExpired,
  pickupDeadline,
  reservationTotals,
  type DemoApprovedPayload,
  type DemoCollectedPayload,
  type DemoDeclinedPayload,
  type DemoPaymentMethod,
  type DemoPlacedPayload,
  type Fulfilment,
  type ReservationTotals,
} from '@medfind/core';
import { supabase } from '../../lib/supabase';
import { customer, findInventory, findMedicine, findPharmacy, medicineName } from './data';

export type DemoStatus = 'waiting' | 'ready' | 'collected' | 'cancelled' | 'declined' | 'expired';

export interface DemoReservation {
  id: string;
  medicineId: string;
  medicineName: string;
  pharmacyId: string;
  pharmacyName: string;
  quantity: number;
  fulfilment: Fulfilment;
  totals: ReservationTotals;
  status: DemoStatus;
  pickupCode: string;
  /** Short reference the pharmacy sees, e.g. "AB-145". */
  ref: string;
  placedAt: Date;
  readyAt?: Date;
  declineReason?: string;
  /** How the customer pays. */
  payment: DemoPaymentMethod;
  /** Card used, e.g. "1456". */
  cardLast4?: string;
  /** Delivery address line. */
  addressLine?: string;
  rx: boolean;
  collectedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  /** Stars (1–5) after collection. */
  rating?: number;
  /** Extra minutes bought with "Extend 30 mins". */
  extendedMinutes: number;
  /** Payment reference shown on receipts, e.g. "MF-48233". */
  paymentRef: string;
}

const day = 86_400_000;
let counter = 0;

function code(): string {
  let s = '';
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export interface PlaceOptions {
  payment?: DemoPaymentMethod;
  cardLast4?: string;
  addressLine?: string;
}

function make(
  inventoryId: string,
  quantity: number,
  fulfilment: Fulfilment,
  status: DemoStatus,
  placedAt: Date,
  opts: PlaceOptions = {},
): DemoReservation {
  const inv = findInventory(inventoryId);
  const med = findMedicine(inv.medicineId);
  return {
    payment: opts.payment ?? 'pharmacy',
    cardLast4: opts.cardLast4,
    addressLine: opts.addressLine,
    rx: !!med.rx,
    extendedMinutes: 0,
    paymentRef: `MF-${48000 + Math.floor(Math.random() * 999)}`,
    id: `r${++counter}`,
    medicineId: med.id,
    medicineName: medicineName(med),
    pharmacyId: inv.pharmacyId,
    pharmacyName: findPharmacy(inv.pharmacyId).name,
    quantity,
    fulfilment,
    totals: reservationTotals([{ unitPriceKobo: inv.priceKobo, quantity }], fulfilment),
    status,
    pickupCode: code(),
    ref: `AB-${100 + Math.floor(Math.random() * 900)}`,
    placedAt,
  };
}

const now = Date.now();
/** History as in "My reservations – all" (Figma 538:26148). */
const past = (r: DemoReservation, change: Partial<DemoReservation>): DemoReservation => ({ ...r, ...change });
let reservations: DemoReservation[] = [
  past(make('fuasi:diclofenac', 1, 'pickup', 'collected', new Date(now - 1 * day)), { collectedAt: new Date(now - 1 * day), rating: 5 }),
  past(make('caduces:gestid', 1, 'pickup', 'collected', new Date(now - 2 * day)), { collectedAt: new Date(now - 2 * day) }),
  past(make('mediguy:amoxil', 1, 'pickup', 'cancelled', new Date(now - 3 * day), { payment: 'card', cardLast4: '1456' }), {
    cancelledAt: new Date(now - 3 * day),
    cancelReason: 'Too far',
  }),
  past(make('mediguy:paracetamol', 1, 'pickup', 'collected', new Date(now - 4 * day)), { collectedAt: new Date(now - 4 * day) }),
  past(make('fuasi:amoxil', 1, 'pickup', 'declined', new Date(now - 5 * day)), {
    declineReason: 'Hi Grace, the signature on this prescription is incomplete and the name doesn’t match yours.',
  }),
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Changes a reservation that is still in one of `from` (waiting by default). */
function update(id: string, change: Partial<DemoReservation>, from: DemoStatus[] = ['waiting']): void {
  reservations = reservations.map((r) => (r.id === id && from.includes(r.status) ? { ...r, ...change } : r));
  emit();
}

/** Ids are per-phone counters, so the channel uses a per-launch prefix to keep them unique. */
const session = Math.random().toString(36).slice(2, 8);
const wireId = (r: DemoReservation) => `${session}-${r.id}`;
const localId = (id: string) => (id.startsWith(`${session}-`) ? id.slice(session.length + 1) : undefined);

function placedPayload(r: DemoReservation): DemoPlacedPayload {
  return {
    id: wireId(r),
    ref: r.ref,
    customerName: customer.fullName,
    medicineName: r.medicineName,
    quantity: r.quantity,
    fulfilment: r.fulfilment,
    kind: r.rx ? 'prescription' : 'otc',
    totalKobo: r.totals.totalKobo,
    pharmacyName: r.pharmacyName,
    placedAt: r.placedAt.toISOString(),
    pickupCode: r.pickupCode,
    paymentMethod: r.payment,
  };
}

let channel: RealtimeChannel | null = null;
let joined: Promise<void> | null = null;

function connect(): Promise<void> | null {
  if (!supabase) return null;
  if (joined) return joined;
  channel = supabase
    .channel(DEMO_CHANNEL)
    .on('broadcast', { event: DEMO_EVENTS.approved }, ({ payload }) => {
      const p = payload as DemoApprovedPayload;
      const id = localId(p.id);
      if (id) update(id, { status: 'ready', readyAt: new Date(p.readyAt) });
    })
    .on('broadcast', { event: DEMO_EVENTS.declined }, ({ payload }) => {
      const p = payload as DemoDeclinedPayload;
      const id = localId(p.id);
      if (id) update(id, { status: 'declined', declineReason: p.reason });
    })
    .on('broadcast', { event: DEMO_EVENTS.collected }, ({ payload }) => {
      const p = payload as DemoCollectedPayload;
      const id = localId(p.id);
      if (id) update(id, { status: 'collected', collectedAt: new Date(p.collectedAt) }, ['ready']);
    })
    .on('broadcast', { event: DEMO_EVENTS.sync }, () => {
      for (const r of reservations) if (r.status === 'waiting') send(DEMO_EVENTS.placed, placedPayload(r));
    });
  joined = new Promise((resolve) => channel!.subscribe((status) => status === 'SUBSCRIBED' && resolve()));
  return joined;
}

function send(event: string, payload: object): void {
  channel?.send({ type: 'broadcast', event, payload });
}

/** How long the demo waits before "confirming" when Supabase isn't set up. */
const OFFLINE_CONFIRM_MS = 4000;

/** True when the pharmacy demo can hear us (Supabase Realtime is set up). */
export const isLive = () => !!supabase;

export function placeReservation(
  inventoryId: string,
  quantity: number,
  fulfilment: Fulfilment,
  opts: PlaceOptions = {},
): DemoReservation {
  const r = make(inventoryId, quantity, fulfilment, 'waiting', new Date(), opts);
  reservations = [r, ...reservations];
  emit();
  const live = connect();
  if (live) live.then(() => send(DEMO_EVENTS.placed, placedPayload(r)));
  else setTimeout(() => update(r.id, { status: 'ready', readyAt: new Date() }), OFFLINE_CONFIRM_MS);
  return r;
}

// Unanswered reservations expire after the approval window (rule in @medfind/core).
setInterval(() => {
  const now = new Date();
  if (reservations.some((r) => r.status === 'waiting' && isApprovalExpired(r.placedAt, now))) {
    reservations = reservations.map((r) => (r.status === 'waiting' && isApprovalExpired(r.placedAt, now) ? { ...r, status: 'expired' } : r));
    emit();
  }
}, 1000);

connect();

/** Customer cancels (Figma "Pickup code – cancel reservation"). */
export function cancelReservation(id: string, reason: string): void {
  const r = reservations.find((x) => x.id === id);
  update(id, { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason }, ['waiting', 'ready']);
  if (r) send(DEMO_EVENTS.cancelled, { id: wireId(r), reason });
}

/** Collected at the counter, or handed over by the rider. */
export function markCollected(id: string): void {
  update(id, { status: 'collected', collectedAt: new Date() }, ['ready']);
}

export function rateReservation(id: string, rating: number): void {
  update(id, { rating }, ['collected']);
}

/** "Extend 30 mins · ₦800". */
export function extendPickup(id: string, minutes = 30): void {
  const r = reservations.find((x) => x.id === id);
  if (r) update(id, { extendedMinutes: r.extendedMinutes + minutes }, ['ready']);
}

export function getReservation(id: string): DemoReservation | undefined {
  return reservations.find((r) => r.id === id);
}

export function useReservations(): DemoReservation[] {
  return useSyncExternalStore(subscribe, () => reservations);
}

export function useReservation(id: string | undefined): DemoReservation | undefined {
  return useReservations().find((r) => r.id === id);
}

export const isActive = (r: DemoReservation) => r.status === 'waiting' || r.status === 'ready';
export const deadlineOf = (r: DemoReservation) =>
  r.readyAt ? new Date(pickupDeadline(r.readyAt).getTime() + r.extendedMinutes * 60_000) : undefined;
