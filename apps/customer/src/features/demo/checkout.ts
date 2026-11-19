import type { DemoPaymentMethod } from '@medfind/core';
import { reservationTotals } from '@medfind/core';
import { findInventory, findMedicine } from './data';
import { defaultAddress, defaultCard, getAccount, setAccount, walletMove } from './account';
import { placeReservation, type DemoReservation } from './store';

/** Totals for the checkout in progress. */
export function checkoutTotals() {
  const c = getAccount().checkout;
  if (!c) return null;
  const inv = findInventory(c.inventoryId);
  const med = findMedicine(inv.medicineId);
  return { c, inv, med, totals: reservationTotals([{ unitPriceKobo: inv.priceKobo, quantity: c.quantity }], c.fulfilment) };
}

/**
 * Places the reservation once payment is done. Wallet payments come off the balance now;
 * card and transfer are only "held" until the pharmacy confirms (the copy says so).
 */
export function placeFromCheckout(payment: DemoPaymentMethod): DemoReservation | null {
  const t = checkoutTotals();
  if (!t) return null;
  const a = getAccount();
  const address = a.addresses.find((x) => x.id === t.c.addressId) ?? defaultAddress(a);
  if (payment === 'wallet') walletMove(t.med.name, -t.totals.totalKobo, 'payment');
  const r = placeReservation(t.c.inventoryId, t.c.quantity, t.c.fulfilment, {
    payment,
    cardLast4: payment === 'card' ? defaultCard(a).last4 : undefined,
    addressLine: t.c.fulfilment === 'delivery' ? address.line : undefined,
  });
  setAccount({ checkout: null, method: null });
  return r;
}
