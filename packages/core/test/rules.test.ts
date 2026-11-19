import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reservationTotals, commissionKobo, payoutBreakdown, canApprove, canTransition, isFinalStatus,
  isValidDeclineReason, isValidStaffPasscode, approvalDeadline, pickupDeadline, duePickupWarnings,
  nextPayoutDate, isPayoutDay, acceptsNewReservations, PRESCRIPTION_CHECKS,
} from '../src/rules.ts';

test('pickup NGN 3,450 has no fees; delivery adds NGN 1,000', () => {
  const items = [{ unitPriceKobo: 345000, quantity: 1 }];
  assert.deepEqual(reservationTotals(items, 'pickup'), { subtotalKobo: 345000, deliveryFeeKobo: 0, serviceFeeKobo: 0, totalKobo: 345000 });
  assert.equal(reservationTotals(items, 'delivery').totalKobo, 445000);
  assert.equal(reservationTotals([{ unitPriceKobo: 80000, quantity: 3 }, { unitPriceKobo: 150000, quantity: 1 }], 'pickup').subtotalKobo, 390000);
});

test('totals reject empty orders, bad quantities and fractional kobo', () => {
  assert.throws(() => reservationTotals([], 'pickup'));
  assert.throws(() => reservationTotals([{ unitPriceKobo: 100, quantity: 0 }], 'pickup'));
  assert.throws(() => reservationTotals([{ unitPriceKobo: 10.5, quantity: 1 }], 'pickup'));
});

test('commission is 5% rounded to the nearest kobo', () => {
  assert.equal(commissionKobo(345000), 17250);
  assert.equal(commissionKobo(10), 1); // 0.5 rounds up
  assert.equal(commissionKobo(9), 0);
  assert.equal(commissionKobo(0), 0);
});

test('payout passes on online sales minus 5% of all sales', () => {
  const b = payoutBreakdown([
    { paidOnline: true, subtotalKobo: 345000 },
    { paidOnline: true, subtotalKobo: 100000 },
    { paidOnline: false, subtotalKobo: 200000 },
  ]);
  assert.deepEqual(b, { onlineSalesKobo: 445000, counterSalesKobo: 200000, commissionKobo: 32250, netKobo: 412750 });
  assert.equal(payoutBreakdown([{ paidOnline: false, subtotalKobo: 200000 }]).netKobo, -10000);
});

test('prescription orders need all 4 checks; OTC needs none', () => {
  assert.equal(PRESCRIPTION_CHECKS.length, 4);
  const all = PRESCRIPTION_CHECKS.map((c) => c.key);
  assert.equal(canApprove('otc', []), true);
  assert.equal(canApprove('prescription', all.slice(0, 3)), false);
  assert.equal(canApprove('prescription', all), true);
});

test('status transitions', () => {
  assert.equal(canTransition('pending', 'approved'), true);
  assert.equal(canTransition('pending', 'completed'), false);
  assert.equal(canTransition('ready_for_pickup', 'expired'), true);
  assert.equal(canTransition('declined', 'approved'), false);
  assert.equal(isFinalStatus('completed'), true);
  assert.equal(isFinalStatus('approved'), false);
});

test('decline reason and passcode validation', () => {
  assert.equal(isValidDeclineReason(''), false);
  assert.equal(isValidDeclineReason('   '), false);
  assert.equal(isValidDeclineReason(null), false);
  assert.equal(isValidDeclineReason('Out of stock'), true);
  assert.equal(isValidStaffPasscode('12345'), true);
  assert.equal(isValidStaffPasscode('1234'), false);
  assert.equal(isValidStaffPasscode('12a45'), false);
});

test('deadlines and pickup warnings', () => {
  const t = new Date('2026-11-19T10:00:00Z');
  assert.equal(approvalDeadline(t).toISOString(), '2026-11-19T10:10:00.000Z');
  const deadline = pickupDeadline(t);
  assert.equal(deadline.toISOString(), '2026-11-19T12:00:00.000Z');
  assert.deepEqual(duePickupWarnings(deadline, new Date('2026-11-19T11:00:00Z'), []), []);
  assert.deepEqual(duePickupWarnings(deadline, new Date('2026-11-19T11:31:00Z'), []), [30]);
  assert.deepEqual(duePickupWarnings(deadline, new Date('2026-11-19T11:50:00Z'), [30]), [15]);
  assert.deepEqual(duePickupWarnings(deadline, new Date('2026-11-19T12:01:00Z'), []), []);
});

test('payouts every second Friday', () => {
  assert.equal(nextPayoutDate(new Date('2026-11-19T12:00:00Z')), '2026-11-27');
  assert.equal(nextPayoutDate(new Date('2026-11-27T12:00:00Z')), '2026-11-27');
  assert.equal(nextPayoutDate(new Date('2026-11-28T00:00:00Z')), '2026-12-11');
  assert.equal(isPayoutDay(new Date('2026-12-11T00:00:00Z')), true);
  assert.equal(isPayoutDay(new Date('2026-12-04T00:00:00Z')), false);
});

test('no new reservations in the 2 hours before closing (Lagos time)', () => {
  const hours = { thu: { open: '08:00', close: '21:00' } };
  // 2026-11-19 is a Thursday. 18:30 UTC = 19:30 Lagos: within 2h of 21:00.
  assert.equal(acceptsNewReservations(hours, false, new Date('2026-11-19T18:30:00Z')), false);
  assert.equal(acceptsNewReservations(hours, false, new Date('2026-11-19T15:30:00Z')), true);
  assert.equal(acceptsNewReservations(hours, false, new Date('2026-11-19T06:30:00Z')), false); // 07:30, not open
  assert.equal(acceptsNewReservations(hours, false, new Date('2026-11-20T12:00:00Z')), false); // Friday closed
  assert.equal(acceptsNewReservations({}, true, new Date('2026-11-20T02:00:00Z')), true);
});
