/**
 * Demo data for the customer flow, using the names shown in the Figma frames
 * (customer Grace, Fuasi Pharmacy, Augmentin suspension, ...). Prices are in kobo.
 * The demo is OTC and pay-at-pharmacy only, and runs without a local database.
 */
import type { Kobo, OpeningHours, Weekday } from '@medfind/core';

export interface DemoPharmacy {
  id: string;
  name: string;
  street: string;
  area: string;
  /** Distance from Grace, as drawn in Figma. */
  km: number;
  hours: OpeningHours;
  open24Hours: boolean;
  offersDelivery: boolean;
}

export interface DemoMedicine {
  id: string;
  /** Full name with strength, e.g. "Augmentin suspension 228 mg/5 ml". */
  name: string;
  /** Short name for the order summary, e.g. "Augmentin suspension". */
  short: string;
  /** Prescription-only: the customer attaches a prescription photo before paying. */
  rx?: boolean;
}

export interface DemoInventory {
  id: string;
  pharmacyId: string;
  medicineId: string;
  priceKobo: Kobo;
  quantityInStock: number;
}

const daily = (open: string, close: string): OpeningHours =>
  Object.fromEntries((['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as Weekday[]).map((d) => [d, { open, close }]));

/**
 * The same 3 Port Harcourt pharmacies, 15 medicines and prices as supabase/seed.sql; change both together.
 * Pharmacy names and Augmentin prices are from Figma ("Search – results", 115:671).
 */
export const pharmacies: DemoPharmacy[] = [
  { id: 'fuasi', name: 'Fuasi Pharmacy', street: '50 Evo Road', area: 'GRA Phase 2', km: 1.8, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'caduces', name: 'Caduces Pharma', street: '12 Aba Road', area: 'Rumuogba', km: 3.5, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'mediguy', name: 'Mediguy', street: '8 Olu Obasanjo Road', area: 'D-Line', km: 5, hours: {}, open24Hours: true, offersDelivery: true },
];

export const medicines: DemoMedicine[] = [
  { id: 'augmentin', name: 'Augmentin suspension 228 mg/5 ml', short: 'Augmentin suspension', rx: true },
  { id: 'diclofenac', name: 'Diclofenac 25mg', short: 'Diclofenac' },
  { id: 'gestid', name: 'Gestid 100ml', short: 'Gestid' },
  { id: 'amoxil', name: 'Amoxil 100ml', short: 'Amoxil', rx: true },
  { id: 'paracetamol', name: 'Paracetamol 500mg', short: 'Paracetamol' },
  { id: 'actifed', name: 'Actifed 100ml', short: 'Actifed' },
  { id: 'coartem', name: 'Coartem 80/480mg', short: 'Coartem' },
  { id: 'lonart', name: 'Lonart DS 80/480mg', short: 'Lonart DS' },
  { id: 'panadol-extra', name: 'Panadol Extra 500mg/65mg', short: 'Panadol Extra' },
  { id: 'loratadine', name: 'Loratadine 10mg', short: 'Loratadine' },
  { id: 'vitamin-c', name: 'Emzor Vitamin C 100mg', short: 'Emzor Vitamin C' },
  { id: 'buscopan', name: 'Buscopan 10mg', short: 'Buscopan' },
  { id: 'ors', name: 'Emzor ORS sachets', short: 'Emzor ORS' },
  { id: 'ventolin', name: 'Ventolin Inhaler 100mcg', short: 'Ventolin Inhaler' },
  { id: 'flagyl', name: 'Flagyl 400mg', short: 'Flagyl', rx: true },
];

const stock = (pharmacyId: string, medicineId: string, naira: number, quantityInStock = 20): DemoInventory => ({
  id: `${pharmacyId}:${medicineId}`,
  pharmacyId,
  medicineId,
  priceKobo: naira * 100,
  quantityInStock,
});

/** Naira prices at Fuasi, Caduces and Mediguy (null = not stocked), as in supabase/seed.sql. */
const prices: [string, number | null, number | null, number | null][] = [
  ['augmentin', 3450, 4000, 3400],
  ['diclofenac', 1300, 1200, null],
  ['gestid', 1800, 1900, null],
  ['amoxil', 2600, 2500, 2450],
  ['paracetamol', 650, 600, 550],
  ['actifed', 2200, null, 2100],
  ['coartem', 3600, 3450, 3500],
  ['lonart', 2900, 2800, null],
  ['panadol-extra', 1300, 1250, 1200],
  ['loratadine', 1200, null, 1150],
  ['vitamin-c', 650, 600, 700],
  ['buscopan', 3300, 3200, null],
  ['ors', 1000, 1050, 1000],
  ['ventolin', 5000, 4800, null],
  ['flagyl', null, 1800, 1850],
];

/** Low stock as drawn in Figma (Mediguy has 3 Augmentin) and in the seed. */
const lowStock: Record<string, number> = { 'mediguy:augmentin': 3, 'mediguy:actifed': 4 };

export const inventory: DemoInventory[] = prices.flatMap(([medicineId, ...byPharmacy]) =>
  pharmacies.flatMap((p, i) => {
    const naira = byPharmacy[i];
    return naira == null ? [] : [stock(p.id, medicineId, naira, lowStock[`${p.id}:${medicineId}`] ?? 20)];
  }),
);

export const LOW_STOCK_THRESHOLD = 5;

/** `fullName` is how the pharmacy screens show her (Figma "Review Grace"). */
export const customer = { firstName: 'Grace', fullName: 'Grace Mary' };

/** Profile as drawn in Settings (Figma 2086:25252). */
export const profileSeed = {
  fullName: 'Grace E Grace',
  displayName: 'Grace .E. Grace',
  email: 'gracegary@gmail.com',
  phone: '+234 803 000 2291',
  maskedPhone: '0803 *** 2291',
  dob: { d: '12', m: '04', y: '1994' },
  allergies: 'Penicillin',
};

export interface DemoCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Verve';
  last4: string;
  expiry: string;
  expired?: boolean;
}

/** Saved cards (Figma "Card – choose a card"). */
export const cardsSeed: DemoCard[] = [
  { id: 'visa', brand: 'Visa', last4: '1456', expiry: '08/28' },
  { id: 'mc', brand: 'Mastercard', last4: '2210', expiry: '11/27' },
  { id: 'verve', brand: 'Verve', last4: '7781', expiry: '03/26', expired: true },
];

export interface DemoAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line: string;
}

/** Addresses (Figma "Settings – addresses" and "Delivery – choose address"). */
export const addressesSeed: DemoAddress[] = [
  { id: 'home', label: 'Home', line: '24 Aba Road, Port Harcourt, Rivers' },
  { id: 'work', label: 'Work', line: '5 Trans-Amadi Road, Port Harcourt, Rivers' },
];

export interface DemoWalletEntry {
  id: string;
  title: string;
  date: string;
  /** Positive = money in. Kobo. */
  amountKobo: number;
  kind: 'topup' | 'refund' | 'payment';
}

/** Wallet activity (Figma "Wallet – activity"). */
export const walletSeed: DemoWalletEntry[] = [
  { id: 'w1', title: 'Added money', date: '28-10-2026', amountKobo: 145_000, kind: 'topup' },
  { id: 'w2', title: 'Refund · Cetirizine 10mg', date: '28-10-2026', amountKobo: 245_000, kind: 'refund' },
  { id: 'w3', title: 'Gestid 100ml', date: '28-10-2026', amountKobo: -145_000, kind: 'payment' },
  { id: 'w4', title: 'Paracetamol 500mg', date: '21-10-2026', amountKobo: -60_000, kind: 'payment' },
  { id: 'w5', title: 'Added money', date: '14-10-2026', amountKobo: 500_000, kind: 'topup' },
  { id: 'w6', title: 'Refund · Amoxil 100ml', date: '09-10-2026', amountKobo: 210_000, kind: 'refund' },
  { id: 'w7', title: 'Diclofenac 25mg', date: '02-10-2026', amountKobo: -120_000, kind: 'payment' },
];

/** Wallet balance as drawn (₦5,050). */
export const WALLET_SEED_KOBO = 505_000;

/** Bank details drawn on the transfer screens. */
export const transferAccount = { bank: 'Moniepoint MFB', number: '7821 004 563', walletNumber: '7821 004 512' };
export const withdrawAccount = 'GTBank •••• 2231';

/** Rider on the delivery screens. */
export const rider = { name: 'Musa Ibrahim', short: 'Musa', bike: 'Honda bike · RIV 482 KJ', phone: '+234 803 412 7781' };

/** The superintendent who answers reservations in the pharmacy demo. */
export const pharmacist = { name: 'Yusuf Bilal', initials: 'YB', role: 'Superintendent' };

export const SUPPORT_PHONE = '0700 633 3463';

/** Map positions for the demo pharmacies and Grace (Port Harcourt). */
export const coords: Record<string, { lat: number; lng: number }> = {
  fuasi: { lat: 4.8156, lng: 7.0034 },
  caduces: { lat: 4.8242, lng: 7.0336 },
  mediguy: { lat: 4.7975, lng: 7.0119 },
  grace: { lat: 4.8265, lng: 7.0118 },
};

/** Photos exported from Figma. Medicines without one show a box icon. */
export const medicineImages: Record<string, number> = {
  augmentin: require('../../../assets/demo/augmentin.png'),
  gestid: require('../../../assets/demo/gestid.png'),
};

/** The 2 test customers, matching the accounts in supabase/seed.sql (password MedFind-test-1). */
export const testCustomers = [
  { firstName: 'Grace', fullName: 'Grace Mary', email: 'grace@example.com' },
  { firstName: 'Chinedu', fullName: 'Chinedu Okoro', email: 'chinedu@example.com' },
];

export const medicineName = (m: DemoMedicine) => m.name;
export const findPharmacy = (id: string) => pharmacies.find((p) => p.id === id)!;
export const findMedicine = (id: string) => medicines.find((m) => m.id === id)!;
export const findInventory = (id: string) => inventory.find((i) => i.id === id)!;

/** First medicine whose name matches the search. */
export function searchMedicine(query: string): DemoMedicine | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return medicines.find((m) => m.name.toLowerCase().startsWith(q)) ?? medicines.find((m) => m.name.toLowerCase().includes(q));
}

export const distanceKm = (p: DemoPharmacy) => p.km;
export const formatKm = (km: number) => `${km}km`;

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function openingLabel(p: DemoPharmacy, now = new Date()): string {
  if (p.open24Hours) return 'Open 24 hours';
  const lagosDay = WEEKDAYS[new Date(now.getTime() + 60 * 60_000).getUTCDay()];
  const today = p.hours[lagosDay];
  return today ? `Open until ${today.close}` : 'Closed today';
}
