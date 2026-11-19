/**
 * MedFind business rules. The database enforces the same numbers in
 * supabase/migrations/*_rules.sql, and test/rules-sync.test.ts fails if the two drift apart.
 */
import { assertKobo, type Kobo } from './money.ts';

/** A pharmacy must approve or decline within this many minutes, or the reservation expires. */
export const APPROVAL_WINDOW_MINUTES = 10;
/** Delivery adds NGN 1,000. Pickup is free. There is no service fee. */
export const DELIVERY_FEE_KOBO: Kobo = 100_000;
export const SERVICE_FEE_KOBO: Kobo = 0;
/** MedFind keeps 5% (500 basis points) of the medicine subtotal of every completed order. */
export const COMMISSION_BASIS_POINTS = 500;
/** A ready pickup order must be collected within this many minutes, or it expires and is refunded. */
export const PICKUP_WINDOW_MINUTES = 120;
/** The customer is warned when this many minutes are left to collect. */
export const PICKUP_WARNING_MINUTES = [30, 15] as const;
/** Pharmacies stop taking new reservations this many minutes before closing. */
export const STOP_RESERVATIONS_BEFORE_CLOSE_MINUTES = 120;
/** Staff passcodes are 5 digits. */
export const STAFF_PASSCODE_LENGTH = 5;
/** Pickup codes the customer shows at the counter are 6 digits. */
export const PICKUP_CODE_LENGTH = 6;
/** Payouts go out every second Friday, counted from this Friday. */
export const PAYOUT_ANCHOR_FRIDAY = '2026-11-27';
export const PAYOUT_INTERVAL_DAYS = 14;
/** Lagos is UTC+1 all year (no daylight saving). */
export const LAGOS_UTC_OFFSET_MINUTES = 60;

/** The 4 checks a pharmacist ticks before a prescription order can be approved (labels from Figma). */
export const PRESCRIPTION_CHECKS = [
  { key: 'medicine_and_dosage', label: 'Medicine name and dosage' },
  { key: 'patient_name_and_age', label: 'Patient’s name and age' },
  { key: 'prescriber_name_and_signature', label: 'Prescriber’s name and signature' },
  { key: 'dose_suits_patient_age', label: 'Dose suitable for patient’s age' },
] as const;
export type PrescriptionCheck = (typeof PRESCRIPTION_CHECKS)[number]['key'];

export const RESERVATION_STATUSES = [
  'pending',
  'approved',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'declined',
  'expired',
  'cancelled',
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export type Fulfilment = 'pickup' | 'delivery';
export type OrderKind = 'otc' | 'prescription';

/** Which status changes are allowed. Anything else is refused by the database too. */
export const STATUS_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ['approved', 'declined', 'expired', 'cancelled'],
  approved: ['ready_for_pickup', 'out_for_delivery'],
  ready_for_pickup: ['completed', 'expired'],
  out_for_delivery: ['completed'],
  completed: [],
  declined: [],
  expired: [],
  cancelled: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function isFinalStatus(status: ReservationStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

export interface PricedItem {
  unitPriceKobo: Kobo;
  quantity: number;
}

export interface ReservationTotals {
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo;
  serviceFeeKobo: Kobo;
  totalKobo: Kobo;
}

export function deliveryFee(fulfilment: Fulfilment): Kobo {
  return fulfilment === 'delivery' ? DELIVERY_FEE_KOBO : 0;
}

/** Pickup NGN 3,450 -> total NGN 3,450. Delivery -> NGN 4,450. */
export function reservationTotals(items: readonly PricedItem[], fulfilment: Fulfilment): ReservationTotals {
  if (items.length === 0) throw new Error('A reservation needs at least one item');
  let subtotalKobo = 0;
  for (const item of items) {
    assertKobo(item.unitPriceKobo);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('Quantity must be a whole number of at least 1');
    subtotalKobo += item.unitPriceKobo * item.quantity;
  }
  const deliveryFeeKobo = deliveryFee(fulfilment);
  return {
    subtotalKobo,
    deliveryFeeKobo,
    serviceFeeKobo: SERVICE_FEE_KOBO,
    totalKobo: subtotalKobo + deliveryFeeKobo + SERVICE_FEE_KOBO,
  };
}

/** MedFind's 5% of a medicine subtotal, rounded to the nearest kobo (halves round up). */
export function commissionKobo(subtotalKobo: Kobo): Kobo {
  assertKobo(subtotalKobo);
  return Math.floor((subtotalKobo * COMMISSION_BASIS_POINTS + 5_000) / 10_000);
}

export interface PayoutOrder {
  paidOnline: boolean;
  subtotalKobo: Kobo;
}

export interface PayoutBreakdown {
  onlineSalesKobo: Kobo;
  counterSalesKobo: Kobo;
  commissionKobo: Kobo;
  /** What MedFind sends the pharmacy. Negative means the pharmacy owes MedFind. */
  netKobo: Kobo;
}

/**
 * Online sales are collected by MedFind and passed on minus 5%.
 * Counter sales stay with the pharmacy, so their 5% is taken from the same payout.
 */
export function payoutBreakdown(orders: readonly PayoutOrder[]): PayoutBreakdown {
  let onlineSalesKobo = 0;
  let counterSalesKobo = 0;
  let commission = 0;
  for (const order of orders) {
    if (order.paidOnline) onlineSalesKobo += order.subtotalKobo;
    else counterSalesKobo += order.subtotalKobo;
    commission += commissionKobo(order.subtotalKobo);
  }
  return { onlineSalesKobo, counterSalesKobo, commissionKobo: commission, netKobo: onlineSalesKobo - commission };
}

/** A prescription order needs all 4 checks ticked. An OTC order needs none. */
export function canApprove(kind: OrderKind, ticked: readonly PrescriptionCheck[]): boolean {
  if (kind === 'otc') return true;
  return PRESCRIPTION_CHECKS.every((check) => ticked.includes(check.key));
}

/** A decline must always carry a reason the customer can read. */
export function isValidDeclineReason(reason: string | null | undefined): boolean {
  return typeof reason === 'string' && reason.trim().length >= 3;
}

export function isValidStaffPasscode(passcode: string): boolean {
  return new RegExp(`^\\d{${STAFF_PASSCODE_LENGTH}}$`).test(passcode);
}

export function approvalDeadline(placedAt: Date): Date {
  return new Date(placedAt.getTime() + APPROVAL_WINDOW_MINUTES * 60_000);
}

export function pickupDeadline(readyAt: Date): Date {
  return new Date(readyAt.getTime() + PICKUP_WINDOW_MINUTES * 60_000);
}

/** Which pickup warnings (30, 15) are due at `now`, given the ones already sent. */
export function duePickupWarnings(deadline: Date, now: Date, alreadySent: readonly number[]): number[] {
  const minutesLeft = (deadline.getTime() - now.getTime()) / 60_000;
  if (minutesLeft <= 0) return [];
  return PICKUP_WARNING_MINUTES.filter((m) => minutesLeft <= m && !alreadySent.includes(m));
}

/** Next payout Friday on or after `from` (a UTC date), on the every-second-Friday cycle. */
export function nextPayoutDate(from: Date): string {
  const day = 86_400_000;
  const anchor = Date.parse(`${PAYOUT_ANCHOR_FRIDAY}T00:00:00Z`);
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const diffDays = Math.round((start - anchor) / day);
  const steps = Math.max(0, Math.ceil(diffDays / PAYOUT_INTERVAL_DAYS));
  return new Date(anchor + steps * PAYOUT_INTERVAL_DAYS * day).toISOString().slice(0, 10);
}

export function isPayoutDay(date: Date): boolean {
  return nextPayoutDate(date) === date.toISOString().slice(0, 10);
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
/** Opening hours as stored on a pharmacy, in Lagos time, e.g. { mon: { open: '08:00', close: '21:00' } }. Missing day = closed. */
export type OpeningHours = Partial<Record<Weekday, { open: string; close: string }>>;

const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Whether a pharmacy takes new reservations at `now`: open, and not within 2 hours of closing. */
export function acceptsNewReservations(hours: OpeningHours, open24Hours: boolean, now: Date): boolean {
  if (open24Hours) return true;
  const lagos = new Date(now.getTime() + LAGOS_UTC_OFFSET_MINUTES * 60_000);
  const today = hours[WEEKDAYS[lagos.getUTCDay()]];
  if (!today) return false;
  const minute = lagos.getUTCHours() * 60 + lagos.getUTCMinutes();
  return minute >= minutesOf(today.open) && minute < minutesOf(today.close) - STOP_RESERVATIONS_BEFORE_CLOSE_MINUTES;
}
