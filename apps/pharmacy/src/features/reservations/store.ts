'use client';

/**
 * Reservations for the pharmacy demo (Fuasi Pharmacy, staff Yusuf Bilal).
 * Grace's reservations arrive live from the customer app over a Supabase Realtime
 * broadcast channel, and Approve / Decline go back the same way, so her Pickup code
 * screen changes straight away. The other cards are the sample orders drawn in Figma.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  DEMO_CHANNEL,
  DEMO_EVENTS,
  approvalMsLeft,
  isApprovalExpired,
  type DemoApprovedPayload,
  type DemoDeclinedPayload,
  type DemoPlacedPayload,
  type Fulfilment,
  type OrderKind,
} from '@medfind/core';
import { supabase } from '../../lib/supabase';

export const staff = { name: 'Yusuf Bilal', firstName: 'Yusuf', code: '5K-348', pharmacy: 'Fuasi Pharmacy' };

export type PharmacyStatus = 'review' | 'ready' | 'declined' | 'expired';

export interface PharmacyReservation {
  id: string;
  ref: string;
  customerName: string;
  medicineName: string;
  quantity: number;
  fulfilment: Fulfilment;
  kind: OrderKind;
  totalKobo: number;
  placedAt: Date;
  pickupCode: string;
  status: PharmacyStatus;
  readyAt?: Date;
  approvedBy?: string;
  /** True for orders that came from the customer app (Grace), false for Figma samples. */
  live: boolean;
}

const min = 60_000;
const loadedAt = Date.now();

function sample(
  id: string,
  customerName: string,
  medicineName: string,
  quantity: number,
  kind: OrderKind,
  fulfilment: Fulfilment,
  naira: number,
  status: PharmacyStatus,
  minutesAgo: number,
): PharmacyReservation {
  const placedAt = new Date(loadedAt - minutesAgo * min);
  return {
    id,
    ref: id.toUpperCase(),
    customerName,
    medicineName,
    quantity,
    kind,
    fulfilment,
    totalKobo: naira * 100,
    placedAt,
    pickupCode: '',
    status,
    readyAt: status === 'ready' ? placedAt : undefined,
    live: false,
  };
}

/** Sample cards from "Reservations" (Figma 196:3840). */
let reservations: PharmacyReservation[] = [
  sample('ab-201', 'Bob Mackie', 'Cetirizine 5mg', 2, 'otc', 'pickup', 3700, 'review', 6.8),
  sample('ab-123', 'Annie Oak', 'Loratadine 10mg', 1, 'otc', 'pickup', 1350, 'ready', 10),
  sample('ab-789', 'Tunde Yomi', 'Loratadine 10mg', 1, 'otc', 'pickup', 1350, 'ready', 90),
];

/** "Activity today" (Figma 196:3840). */
export const activityToday = [
  { name: 'Grace Bello', detail: 'Losartan 50mg . 18:00', label: 'Confirmed', tone: 'success' as const },
  { name: 'Amos Gandu', detail: 'Lisinopril 5mg . 15:00', label: 'Collected', tone: 'success' as const },
  { name: 'James Adjei', detail: 'Atorvastatin 20mg . 14:30', label: 'Rejected', tone: 'warning' as const },
  { name: 'Sarah Mensah', detail: 'Amlodipine 5mg . 14:00', label: 'Collected', tone: 'success' as const },
  { name: 'Daniel Okoro', detail: 'Metformin 500mg . 12:00', label: 'Expired', tone: 'error' as const },
];

// Without Supabase settings there is no live Grace, so show her Figma sample to keep the screens viewable.
if (!supabase) {
  reservations = [
    { ...sample('ab-145', 'Grace Mary', 'Augmentin suspension 228 mg/5 ml', 1, 'prescription', 'pickup', 3450, 'review', 0.2), pickupCode: '482915' },
    ...reservations,
  ];
}

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
      const p = payload as DemoPlacedPayload;
      if (reservations.some((r) => r.id === p.id)) return;
      reservations = [
        { ...p, placedAt: new Date(p.placedAt), status: 'review', live: true },
        ...reservations,
      ];
      emit();
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

export function approve(id: string): void {
  const readyAt = new Date();
  update(id, { status: 'ready', readyAt, approvedBy: staff.name });
  const r = reservations.find((x) => x.id === id);
  if (r?.live) send(DEMO_EVENTS.approved, { id, readyAt: readyAt.toISOString(), approvedBy: staff.name } satisfies DemoApprovedPayload);
}

export function decline(id: string, reason: string): void {
  update(id, { status: 'declined' });
  const r = reservations.find((x) => x.id === id);
  if (r?.live) send(DEMO_EVENTS.declined, { id, reason: reason.trim() } satisfies DemoDeclinedPayload);
}

if (typeof window !== 'undefined') {
  connect();
  // Unanswered reservations expire after the approval window (rule in @medfind/core).
  setInterval(() => {
    const now = new Date();
    if (reservations.some((r) => r.status === 'review' && isApprovalExpired(r.placedAt, now))) {
      reservations = reservations.map((r) =>
        r.status === 'review' && isApprovalExpired(r.placedAt, now) ? { ...r, status: 'expired' } : r,
      );
      emit();
    }
  }, 1000);
}

const EMPTY: PharmacyReservation[] = [];
const getServer = () => EMPTY;

export function useReservations(): PharmacyReservation[] {
  return useSyncExternalStore(subscribe, () => reservations, getServer);
}

export function useReservation(id: string): PharmacyReservation | undefined {
  return useReservations().find((r) => r.id === id);
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
