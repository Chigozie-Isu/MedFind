/**
 * Messages the customer and pharmacy demo apps send each other over one
 * Supabase Realtime broadcast channel. The demo keeps its data in the apps
 * (no database rows), so these are plain JSON payloads.
 */
import type { Fulfilment, OrderKind } from './rules.ts';

export const DEMO_CHANNEL = 'medfind-demo';

export interface DemoPlacedPayload {
  id: string;
  /** Short reference shown to the pharmacy, e.g. "AB-145". */
  ref: string;
  customerName: string;
  medicineName: string;
  quantity: number;
  fulfilment: Fulfilment;
  kind: OrderKind;
  totalKobo: number;
  pharmacyName: string;
  /** ISO time. */
  placedAt: string;
  pickupCode: string;
  /** How the customer is paying. Older customer builds leave it out (pay at pharmacy). */
  paymentMethod?: DemoPaymentMethod;
}

export type DemoPaymentMethod = 'pharmacy' | 'wallet' | 'card' | 'transfer';

/** Sent by the pharmacy when the customer collects (or the rider hands over) the order. */
export interface DemoCollectedPayload {
  id: string;
  /** ISO time. */
  collectedAt: string;
}

/** Sent by the customer when they cancel, so the pharmacy can drop the card. */
export interface DemoCancelledPayload {
  id: string;
  reason: string;
}

export interface DemoApprovedPayload {
  id: string;
  /** ISO time. */
  readyAt: string;
  approvedBy: string;
}

export interface DemoDeclinedPayload {
  id: string;
  reason: string;
}

/** Broadcast event names. `sync` asks the customer app to send its waiting reservations again. */
export const DEMO_EVENTS = {
  placed: 'reservation_placed',
  approved: 'reservation_approved',
  declined: 'reservation_declined',
  sync: 'sync_request',
  collected: 'reservation_collected',
  cancelled: 'reservation_cancelled',
} as const;
