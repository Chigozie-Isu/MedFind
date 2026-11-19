/**
 * In-memory reservations for the demo flow. The real app calls `place_reservation`;
 * here a reservation is kept on the phone until the app restarts.
 */
import { useSyncExternalStore } from 'react';
import { PICKUP_CODE_LENGTH, pickupDeadline, reservationTotals, type Fulfilment, type ReservationTotals } from '@medfind/core';
import { findInventory, findMedicine, findPharmacy, medicineName, pharmacies } from './data';

export type DemoStatus = 'waiting' | 'ready' | 'collected' | 'cancelled';

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
  placedAt: Date;
  readyAt?: Date;
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
    placedAt,
  };
}

const [admiralty, adesola, , sabo] = pharmacies.map((p) => p.id);
const now = Date.now();
/** Past orders like the seed's: Ada collected Panadol Extra, Loratadine and Gestid. */
let reservations: DemoReservation[] = [
  make(`${admiralty}:panadol-extra`, 1, 'pickup', 'collected', new Date(now - 3 * day)),
  make(`${adesola}:emzor-ors`, 2, 'delivery', 'cancelled', new Date(now - 6 * day)),
  make(`${admiralty}:loratadine`, 1, 'pickup', 'collected', new Date(now - 9 * day)),
  make(`${sabo}:gestid`, 1, 'pickup', 'collected', new Date(now - 12 * day)),
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function placeReservation(inventoryId: string, quantity: number, fulfilment: Fulfilment): DemoReservation {
  const r = make(inventoryId, quantity, fulfilment, 'waiting', new Date());
  reservations = [r, ...reservations];
  emit();
  return r;
}

/** Stands in for the pharmacy approving and marking the order ready. */
export function markReady(id: string): void {
  reservations = reservations.map((r) => (r.id === id && r.status === 'waiting' ? { ...r, status: 'ready', readyAt: new Date() } : r));
  emit();
}

export function useReservations(): DemoReservation[] {
  return useSyncExternalStore(subscribe, () => reservations);
}

export function useReservation(id: string | undefined): DemoReservation | undefined {
  return useReservations().find((r) => r.id === id);
}

export const isActive = (r: DemoReservation) => r.status === 'waiting' || r.status === 'ready';
export const deadlineOf = (r: DemoReservation) => (r.readyAt ? pickupDeadline(r.readyAt) : undefined);
