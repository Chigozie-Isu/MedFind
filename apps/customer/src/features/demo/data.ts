/**
 * Demo data copied from supabase/seed.sql (pharmacies, OTC medicines, Ada's home address),
 * so the demo flow runs without a local database. Prescription medicines are left out:
 * the demo is OTC and pay-at-pharmacy only.
 *
 * Prices follow the seed's idea (base price plus up to 20%, rounded to NGN 50) with a simpler
 * hash, so they are close to the database but not identical. Coartem at Admiralty Care is
 * NGN 3,450 exactly, as in the seed.
 */
import type { Kobo, OpeningHours, Weekday } from '@medfind/core';

export interface DemoPharmacy {
  id: string;
  name: string;
  street: string;
  area: string;
  lat: number;
  lng: number;
  hours: OpeningHours;
  open24Hours: boolean;
  offersDelivery: boolean;
}

export interface DemoMedicine {
  id: string;
  brand: string;
  strength: string | null;
  pack: string;
  baseNaira: number;
}

export interface DemoInventory {
  id: string;
  pharmacyId: string;
  medicineId: string;
  priceKobo: Kobo;
  quantityInStock: number;
}

const week = (open: string, close: string, sat?: [string, string], sun?: [string, string]): OpeningHours => ({
  mon: { open, close },
  tue: { open, close },
  wed: { open, close },
  thu: { open, close },
  fri: { open, close },
  ...(sat ? { sat: { open: sat[0], close: sat[1] } } : {}),
  ...(sun ? { sun: { open: sun[0], close: sun[1] } } : {}),
});

export const pharmacies: DemoPharmacy[] = [
  { id: 'a1000000-0000-4000-8000-000000000001', name: 'Admiralty Care Pharmacy', street: '12 Admiralty Way', area: 'Lekki Phase 1', lat: 6.4474, lng: 3.4723, hours: week('08:00', '22:00', ['09:00', '21:00'], ['12:00', '20:00']), open24Hours: false, offersDelivery: true },
  { id: 'a1000000-0000-4000-8000-000000000002', name: 'Adesola 24/7 Pharmacy', street: '45 Akin Adesola Street', area: 'Victoria Island', lat: 6.4317, lng: 3.4211, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'a1000000-0000-4000-8000-000000000003', name: 'Isaac John Pharmacy', street: '8 Isaac John Street', area: 'Ikeja GRA', lat: 6.579, lng: 3.353, hours: week('08:00', '21:00', ['09:00', '20:00']), open24Hours: false, offersDelivery: true },
  { id: 'a1000000-0000-4000-8000-000000000004', name: 'Sabo Health Pharmacy', street: '210 Herbert Macaulay Way', area: 'Yaba', lat: 6.5095, lng: 3.379, hours: {}, open24Hours: true, offersDelivery: true },
  { id: 'a1000000-0000-4000-8000-000000000005', name: 'Ogunsanya Family Pharmacy', street: '31 Adeniran Ogunsanya Street', area: 'Surulere', lat: 6.496, lng: 3.354, hours: week('07:30', '21:30', ['08:00', '21:00'], ['13:00', '19:00']), open24Hours: false, offersDelivery: false },
  { id: 'a1000000-0000-4000-8000-000000000006', name: 'Ajah Wellness Pharmacy', street: '4 Abraham Adesanya Road', area: 'Ajah', lat: 6.468, lng: 3.585, hours: week('08:00', '22:00', ['08:00', '22:00'], ['10:00', '20:00']), open24Hours: false, offersDelivery: true },
];

const catalogue: Array<[brand: string, strength: string | null, pack: string, baseNaira: number]> = [
  ['Emzor Paracetamol', '500mg', '12 tablets', 500],
  ['Panadol Extra', '500mg/65mg', '12 tablets', 1200],
  ['Panadol Baby and Infant', '120mg/5ml', '100ml bottle', 2300],
  ['Nurofen', '200mg', '16 tablets', 3000],
  ['Coartem', '80/480mg', '6 tablets', 3450],
  ['Lonart DS', '80/480mg', '6 tablets', 2800],
  ['Amatem Forte', '80/480mg', '6 tablets', 2500],
  ['P-Alaxin', '40/320mg', '9 tablets', 3200],
  ['Loratadine', '10mg', '10 tablets', 1200],
  ['Piriton', '4mg', '30 tablets', 900],
  ['Zyrtec', '10mg', '7 tablets', 2000],
  ['Benylin Original', null, '100ml bottle', 2700],
  ['Emzor Vitamin C', '100mg', '100 tablets', 600],
  ['Seven Seas Cod Liver Oil', null, '60 capsules', 6500],
  ['Vitamin B Complex', null, '30 tablets', 500],
  ['Gestid', null, '100ml bottle', 1500],
  ['Buscopan', '10mg', '20 tablets', 3200],
  ['Omeprazole', '20mg', '14 capsules', 1500],
  ['Emzor ORS', null, '10 sachets', 1000],
  ['Zinkid', '20mg', '10 tablets', 800],
  ['Robb', null, '25g tin', 700],
  ['Funbact-A', null, '30g tube', 1200],
  ['Dettol Antiseptic', null, '250ml bottle', 2000],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const medicines: DemoMedicine[] = catalogue.map(([brand, strength, pack, baseNaira]) => ({
  id: slug(brand),
  brand,
  strength,
  pack,
  baseNaira,
}));

/** Small stable string hash (FNV-1a), standing in for Postgres `hashtext` in the seed. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const inventory: DemoInventory[] = pharmacies.flatMap((p) =>
  medicines
    .filter((m) => hash(`${p.name}~${m.brand}`) % 10 !== 0 || m.brand === 'Coartem')
    .map((m) => {
      const fixed = p.id === pharmacies[0].id && m.brand === 'Coartem';
      const markup = 1 + (hash(`${p.name}|${m.brand}`) % 21) / 100;
      return {
        id: `${p.id}:${m.id}`,
        pharmacyId: p.id,
        medicineId: m.id,
        priceKobo: fixed ? 345_000 : Math.round((m.baseNaira * markup) / 50) * 50 * 100,
        quantityInStock: fixed ? 25 : hash(`${m.brand}#${p.name}`) % 11 === 0 ? 3 : 8 + (hash(p.name + m.brand) % 40),
      };
    }),
);

/** Seed `low_stock_threshold`. */
export const LOW_STOCK_THRESHOLD = 5;

/** Ada's saved home address in the seed (14 Fola Osibo Road, Lekki Phase 1). */
export const customer = { firstName: 'Ada', lat: 6.4441, lng: 3.4705 };

export const medicineName = (m: DemoMedicine) => (m.strength ? `${m.brand} ${m.strength}` : m.brand);
export const findPharmacy = (id: string) => pharmacies.find((p) => p.id === id)!;
export const findMedicine = (id: string) => medicines.find((m) => m.id === id)!;
export const findInventory = (id: string) => inventory.find((i) => i.id === id)!;

/** First medicine whose brand matches the search. */
export function searchMedicine(query: string): DemoMedicine | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return medicines.find((m) => m.brand.toLowerCase().startsWith(q)) ?? medicines.find((m) => medicineName(m).toLowerCase().includes(q));
}

/** Straight-line distance from the customer in km. */
export function distanceKm(p: DemoPharmacy): number {
  const rad = Math.PI / 180;
  const dLat = (p.lat - customer.lat) * rad;
  const dLng = (p.lng - customer.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(customer.lat * rad) * Math.cos(p.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export const formatKm = (km: number) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function openingLabel(p: DemoPharmacy, now = new Date()): string {
  if (p.open24Hours) return 'Open 24 hours';
  const lagosDay = WEEKDAYS[new Date(now.getTime() + 60 * 60_000).getUTCDay()];
  const today = p.hours[lagosDay];
  return today ? `Open until ${today.close}` : 'Closed today';
}
