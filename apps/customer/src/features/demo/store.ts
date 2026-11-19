/**
 * In-memory reservations for the demo flow. The real app calls `place_reservation`;
 * here a reservation is kept on the phone until the app restarts.
 *
 * The pharmacy app hears about a new reservation, and answers it, over a Supabase
 * Realtime broadcast channel (see `@medfind/core` demoChannel). Without Supabase
 * settings the demo falls back to confirming after a few seconds.
 */
import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  DEMO_CHANNEL,
  DEMO_EVENTS,
  PICKUP_CODE_LENGTH,
  isApprovalExpired,
  pickupDeadline,
  reservationTotals,
  type DemoApprovedPayload,
  type DemoDeclinedPayload,
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
}

const day = 86_400_000;
let counter = 0;

function code(): string {
  let s = '';
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function make(inventoryId: string, quantity: number, fulfilment: Fulfilment, status: DemoStatus, placedAt: Date): DemoReservation {
  const inv = findInventory(inventoryId);
  const med = findMedicine(inv.medicineId);
  return {
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
let reservations: DemoReservation[] = [
  make('fuasi:diclofenac', 1, 'pickup', 'collected', new Date(now - 1 * day)),
  make('caduces:gestid', 1, 'pickup', 'collected', new Date(now - 2 * day)),
  make('mediguy:amoxil', 1, 'pickup', 'cancelled', new Date(now - 3 * day)),
  make('mediguy:paracetamol', 1, 'pickup', 'collected', new Date(now - 4 * day)),
];

const STORAGE_KEY = 'medfind.demo.reservations.v1';
let hydrated = false;
let hydration: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => { void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reservations)).catch(() => {}); };
export function hydrateReservations(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydration) return hydration;
  hydration = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const values: unknown = JSON.parse(raw);
        if (Array.isArray(values)) {
          const restored = values.filter((r): r is DemoReservation => !!r && typeof r === 'object' && typeof r.id === 'string' && typeof r.medicineId === 'string' && typeof r.status === 'string').map((r) => ({ ...r, placedAt: new Date(r.placedAt), readyAt: r.readyAt ? new Date(r.readyAt) : undefined }));
          reservations = restored;
          counter = Math.max(counter, ...restored.map((r) => Number(/^r(\\d+)$/.exec(r.id)?.[1] ?? 0)));
        }
      }
    } catch { /* Use seed reservations if storage is unavailable. */ }
    hydrated = true;
    emit();
  })();
  return hydration;
}
export async function resetDemoReservations(): Promise<void> {
  await hydrateReservations();
  reservations = [];
  counter = 0;
  persist();
  emit();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function update(id: string, change: Partial<DemoReservation>): void {
  reservations = reservations.map((r) => (r.id === id && r.status === 'waiting' ? { ...r, ...change } : r));
  persist();
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
    kind: 'prescription',
    totalKobo: r.totals.totalKobo,
    pharmacyName: r.pharmacyName,
    placedAt: r.placedAt.toISOString(),
    pickupCode: r.pickupCode,
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

export function placeReservation(inventoryId: string, quantity: number, fulfilment: Fulfilment): DemoReservation {
  const r = make(inventoryId, quantity, fulfilment, 'waiting', new Date());
  reservations = [r, ...reservations];
  persist();
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
    persist();
    emit();
  }
}, 1000);

connect();

export function useReservations(): DemoReservation[] {
  useEffect(() => { void hydrateReservations(); }, []);
  return useSyncExternalStore(subscribe, () => reservations);
}

export function cancelReservation(id: string): boolean {
  const r = reservations.find((item) => item.id === id);
  if (!r || (r.status !== 'waiting' && r.status !== 'ready')) return false;
  reservations = reservations.map((item) => item.id === id ? { ...item, status: 'cancelled' as const } : item);
  persist();
  emit();
  return true;
}

export function markCollected(id: string): boolean {
  const r = reservations.find((item) => item.id === id);
  if (!r || r.status !== 'ready') return false;
  reservations = reservations.map((item) => item.id === id ? { ...item, status: 'collected' as const } : item);
  persist();
  emit();
  return true;
}

export function useReservation(id: string | undefined): DemoReservation | undefined {
  return useReservations().find((r) => r.id === id);
}

export const isActive = (r: DemoReservation) => r.status === 'waiting' || r.status === 'ready';
export const deadlineOf = (r: DemoReservation) => (r.readyAt ? pickupDeadline(r.readyAt) : undefined);
