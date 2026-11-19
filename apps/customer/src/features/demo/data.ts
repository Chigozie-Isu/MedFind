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

export const pharmacies: DemoPharmacy[] = [
  { id: 'fuasi', name: 'Fuasi Pharmacy', street: '50 Evo Road', area: 'GRA', km: 1.8, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'caduces', name: 'Caduces Pharma', street: '12 Aba Road', area: 'Port Harcourt', km: 3.5, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'mediguy', name: 'Mediguy', street: '8 Olu Obasanjo Road', area: 'Port Harcourt', km: 5, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'precious', name: 'Precious Pharmacy', street: '21 Woji Road', area: 'Woji', km: 2.4, hours: daily('08:00', '22:00'), open24Hours: false, offersDelivery: true },
  { id: 'green-cross', name: 'Green Cross Pharmacy', street: '3 Stadium Road', area: 'Elekahia', km: 4.1, hours: daily('08:00', '21:00'), open24Hours: false, offersDelivery: false },
];

export const medicines: DemoMedicine[] = [
  { id: 'augmentin', name: 'Augmentin suspension 228 mg/5 ml', short: 'Augmentin suspension' },
  { id: 'diclofenac', name: 'Diclofenac 25mg', short: 'Diclofenac' },
  { id: 'gestid', name: 'Gestid 100ml', short: 'Gestid' },
  { id: 'amoxil', name: 'Amoxil 100ml', short: 'Amoxil' },
  { id: 'paracetamol', name: 'Paracetamol 500mg', short: 'Paracetamol' },
  { id: 'actifed', name: 'Actifed 100ml', short: 'Actifed' },
];

const stock = (pharmacyId: string, medicineId: string, naira: number, quantityInStock = 20): DemoInventory => ({
  id: `${pharmacyId}:${medicineId}`,
  pharmacyId,
  medicineId,
  priceKobo: naira * 100,
  quantityInStock,
});

/** Augmentin prices and stock match "Search – results" (Figma 115:671). */
export const inventory: DemoInventory[] = [
  stock('fuasi', 'augmentin', 3450),
  stock('caduces', 'augmentin', 4000),
  stock('mediguy', 'augmentin', 3400, 3),
  stock('precious', 'diclofenac', 1200),
  stock('fuasi', 'diclofenac', 1300),
  stock('precious', 'gestid', 1800),
  stock('caduces', 'gestid', 1900),
  stock('precious', 'amoxil', 2500),
  stock('green-cross', 'paracetamol', 600),
  stock('fuasi', 'paracetamol', 650),
  stock('fuasi', 'actifed', 2200),
  stock('precious', 'actifed', 2100, 4),
];

export const LOW_STOCK_THRESHOLD = 5;

/** `fullName` is how the pharmacy screens show her (Figma "Review Grace"). */
export const customer = { firstName: 'Grace', fullName: 'Grace Mary' };

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
