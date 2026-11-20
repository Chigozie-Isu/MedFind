'use client';

/**
 * Pharmacy demo data (Fuasi Pharmacy, staff Yusuf Bilal) for Inventory, Activity, Earnings,
 * Profile and hours, Employees and Shift history. Everything is sample data from the Figma
 * frames, kept in this browser (localStorage) so edits show up on every screen and survive a
 * refresh. "Reset demo" on Profile puts it all back.
 */
import { useEffect, useSyncExternalStore } from 'react';

export type StockStatus = 'in' | 'low' | 'out';

export interface StockItem {
  id: string;
  brand: string;
  generic: string;
  dosage: string;
  pack: string;
  quantity: number;
  /** Price in kobo. */
  priceKobo: number;
  prescription: boolean;
  expiry: string;
  updatedAt: string;
  updatedBy: string;
}

export type ActivityKind = 'reservation' | 'stock' | 'account';
export type Tone = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface ActivityEntry {
  id: string;
  at: string;
  employee: string;
  role: string;
  text: string;
  kind: ActivityKind;
  statuses: { label: string; tone: Tone }[];
}

export type PaymentMethod = 'Online · Transfer' | 'Online · Wallet' | 'Online · Card' | 'Counter' | 'Payout';

export interface Transaction {
  id: string;
  at: string;
  item: string;
  method: PaymentMethod;
  code: string;
  /** Kobo. */
  paidKobo: number;
}

export type Role = 'Superintendent pharmacist' | 'Manager/ Pharmacist' | 'Pharmacist' | 'Junior Pharmacist' | 'Cashier';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  phone: string;
  email: string;
  code: string;
  addedAt: string;
  active: boolean;
}

export interface Shift {
  id: string;
  day: string;
  employee: string;
  reservations: number;
  opening: string;
  closing: string;
  hours: string;
  complete: boolean;
}

export type DayKey = 'weekdays' | 'saturday' | 'sunday' | 'holidays';
export interface DayHours {
  open: string;
  close: string;
  allDay: boolean;
}

export interface WorkspaceState {
  pharmacy: string;
  isNewPharmacy?: boolean;
  superintendentPcn?: string;
  payoutBank?: string;
  payoutLast4?: string;
  staffName: string;
  staffRole: Role;
  staffCode: string;
  address: string;
  phone: string;
  services: string[];
  /** Data URL of a cover photo the pharmacist chose, or '' for the Figma photo. */
  cover: string;
  hours: Record<DayKey, DayHours>;
  accepting: boolean;
  items: StockItem[];
  activity: ActivityEntry[];
  employees: Employee[];
  shifts: Shift[];
  transactions: Transaction[];
  notificationsRead: boolean;
  clockedInAt: string;
}

export const DAY_LABELS: Record<DayKey, string> = {
  weekdays: 'Monday – Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  holidays: 'Public holidays',
};

export const ALL_SERVICES = ['Prescriptions', 'Vaccinations', 'Wound care', 'Blood pressure checks', 'Malaria tests', 'Home delivery'];

const today = () => new Date().toISOString().slice(0, 10);
const at = (hhmm: string, daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

function item(id: string, brand: string, generic: string, dosage: string, pack: string, quantity: number, naira: number, prescription: boolean, updated: string, by: string): StockItem {
  return { id, brand, generic, dosage, pack, quantity, priceKobo: naira * 100, prescription, expiry: '2028-06-30', updatedAt: updated, updatedBy: by };
}

const YUSUF = { employee: 'Yusuf Bilal', role: 'Superintendent' };

function initialState(): WorkspaceState {
  return {
    pharmacy: 'Fuasi Pharmacy',
    staffName: 'Yusuf Bilal',
    staffRole: 'Superintendent pharmacist',
    staffCode: '5K-348',
    address: 'No. 50 EVO Road, Off Nibble restaurant, GRA, Port Harcourt, Rivers State',
    phone: '+234 810 9876 5432',
    services: ['Prescriptions', 'Vaccinations', 'Wound care', 'Blood pressure checks'],
    cover: '',
    hours: {
      weekdays: { open: '08:00', close: '20:00', allDay: true },
      saturday: { open: '08:00', close: '15:00', allDay: false },
      sunday: { open: '14:00', close: '22:00', allDay: false },
      holidays: { open: '08:00', close: '13:00', allDay: false },
    },
    accepting: true,
    items: [
      item('diovan', 'Diovan', 'Valsartan', '80 mg', '24 cards in packet', 180, 5600, true, '2026-11-06', 'Oge Onyeoma'),
      item('atenolol', 'Atenolol', 'Atenolol', '50 mg', '2 cards in packet', 100, 2250, true, '2026-11-01', 'Yusuf Bilal'),
      item('diclofenac', 'Diclofenac', 'Diclofenac sodium', '25 mg', '24 pills in packet', 10, 1450, false, '2026-10-20', 'Miriam Gau'),
      item('amlodipine', 'Amlodipine', 'Amlodipine besilate', '10 mg', '7 cards in packet', 3, 3450, true, '2026-10-20', 'Yusuf Bilal'),
      item('lisinopril', 'Lisinopril', 'Lisinopril', '10 mg', '3 cards in packet', 0, 2800, true, '2026-10-19', 'Miriam Gau'),
      item('augmentin', 'Augmentin', 'Co-amoxiclav', '228 mg/5 ml', '1 bottle', 57, 3450, true, '2026-11-08', 'Yusuf Bilal'),
      item('cetirizine', 'Cetirizine', 'Cetirizine', '5 mg', '30 tablets', 42, 1850, false, '2026-11-07', 'Frank Great'),
      item('loratadine', 'Loratadine', 'Loratadine', '10 mg', '10 tablets', 64, 1350, false, '2026-11-07', 'Frank Great'),
      item('ventolin', 'Ventolin', 'Salbutamol inhaler', '100 mcg', '200 doses', 2, 4900, true, '2026-11-02', 'Oge Onyeoma'),
      item('coartem', 'Coartem', 'Artemether/lumefantrine', '80/480 mg', '6 tablets', 0, 3200, false, '2026-10-30', 'Raol Kane'),
      item('gestid', 'Gestid', 'Antacid suspension', '100 ml', '1 bottle', 350, 1500, false, '2026-11-08', 'Mary Bassey'),
      item('paracetamol', 'Emzor Paracetamol', 'Paracetamol', '500 mg', '96 tablets', 210, 900, false, '2026-11-05', 'Jide Elliot'),
    ],
    activity: [
      { id: 'a1', at: at('18:00'), ...YUSUF, kind: 'reservation', text: 'Handed over and Marked AB-522 picked up· Amoxicillin suspension × 1 · code checked', statuses: [{ label: 'Collected', tone: 'success' }] },
      { id: 'a2', at: at('17:00'), ...YUSUF, kind: 'reservation', text: 'Handed over and Marked AB-433 paid · Gestid 100ml × 3· ₦4,500', statuses: [{ label: 'Collected', tone: 'success' }, { label: 'Paid at counter', tone: 'info' }] },
      { id: 'a3', at: at('16:00'), ...YUSUF, kind: 'reservation', text: 'Accepted AB-433 · Gestid 100ml × 3', statuses: [{ label: 'Accepted', tone: 'success' }] },
      { id: 'a4', at: at('15:30'), ...YUSUF, kind: 'reservation', text: 'Declined AB-567 · Diclofenac 25mg × 2', statuses: [{ label: 'Declined', tone: 'error' }] },
      { id: 'a5', at: at('15:30'), ...YUSUF, kind: 'reservation', text: 'Declined AB-567 · Prescription for Atorvastatin 40 mg × 2', statuses: [{ label: 'Declined', tone: 'error' }] },
      { id: 'a6', at: at('14:10'), employee: 'Oge Onyeoma', role: 'Pharmacist', kind: 'stock', text: 'Added 60 × Diovan 80 mg to stock', statuses: [{ label: 'Stock added', tone: 'info' }] },
      { id: 'a7', at: at('12:40'), employee: 'Frank Great', role: 'Pharmacist', kind: 'stock', text: 'Changed price of Cetirizine 5 mg to ₦1,850', statuses: [{ label: 'Price changed', tone: 'neutral' }] },
      { id: 'a8', at: at('11:15'), employee: 'Mary Bassey', role: 'Manager', kind: 'reservation', text: 'Accepted AB-401 · Loratadine 10mg × 1', statuses: [{ label: 'Accepted', tone: 'success' }] },
      { id: 'a9', at: at('10:05'), employee: 'Mary Bassey', role: 'Manager', kind: 'stock', text: 'Marked Coartem 80/480 mg out of stock', statuses: [{ label: 'Out of stock', tone: 'error' }] },
      { id: 'a10', at: at('18:20', 1), employee: 'Raol Kane', role: 'Junior Pharmacist', kind: 'reservation', text: 'Handed over AB-389 to rider Musa Ibrahim · Ventolin 100 mcg × 1', statuses: [{ label: 'Delivered', tone: 'success' }] },
      { id: 'a11', at: at('16:45', 1), employee: 'Jide Elliot', role: 'Pharmacist', kind: 'stock', text: 'Added 96 × Emzor Paracetamol 500 mg to stock', statuses: [{ label: 'Stock added', tone: 'info' }] },
      { id: 'a12', at: at('09:00', 1), employee: 'Daniel Okoro', role: 'Customer', kind: 'reservation', text: 'AB-377 expired · Metformin 500mg × 1 · no reply in 10 minutes', statuses: [{ label: 'Expired', tone: 'error' }] },
    ],
    employees: [
      { id: 'e1', name: 'Yusuf Bilal', role: 'Superintendent pharmacist', phone: '0803 000 1107', email: 'yusuf@fuasi.example.com', code: '11007', addedAt: '2026-11-02', active: true },
      { id: 'e2', name: 'Frank Great', role: 'Pharmacist', phone: '0803 000 2280', email: '', code: '52380', addedAt: '2026-11-03', active: true },
      { id: 'e3', name: 'Raol Kane', role: 'Junior Pharmacist', phone: '0803 000 3376', email: '', code: '90476', addedAt: '2026-11-03', active: true },
      { id: 'e4', name: 'Mary Bassey', role: 'Manager/ Pharmacist', phone: '0803 000 4479', email: 'mary@fuasi.example.com', code: '34179', addedAt: '2026-11-03', active: true },
      { id: 'e5', name: 'Oge Onyeoma', role: 'Pharmacist', phone: '0803 000 5524', email: '', code: '78224', addedAt: '2026-11-03', active: true },
      { id: 'e6', name: 'Jide Elliot', role: 'Pharmacist', phone: '0803 000 6665', email: '', code: '61865', addedAt: '2026-11-03', active: true },
      { id: 'e7', name: 'Miriam Gau', role: 'Pharmacist', phone: '0803 000 7712', email: '', code: '20512', addedAt: '2026-10-12', active: false },
      { id: 'e8', name: 'Peter Obi', role: 'Cashier', phone: '0803 000 8890', email: '', code: '45690', addedAt: '2026-10-01', active: false },
      { id: 'e9', name: 'Ada Nwosu', role: 'Junior Pharmacist', phone: '0803 000 9913', email: '', code: '83313', addedAt: '2026-09-21', active: false },
    ],
    shifts: [
      { id: 's1', day: today(), employee: 'Yusuf Bilal', reservations: 25, opening: '13:10', closing: '--', hours: '05:11:45', complete: true },
      { id: 's2', day: today(), employee: 'Ogechi Onyeoma', reservations: 54, opening: '09:00', closing: '13:08', hours: '06:08:45', complete: true },
      { id: 's3', day: today(), employee: 'Frank Great', reservations: 1, opening: '08:00', closing: '08:45', hours: '00:00:45', complete: false },
      { id: 's4', day: today(), employee: 'Raol Kane', reservations: 1, opening: '07:05', closing: '08:00', hours: '01:05:48', complete: false },
      { id: 's5', day: today(), employee: 'Mary Bassey', reservations: 94, opening: '01:00', closing: '06:08', hours: '06:08:45', complete: true },
      { id: 's6', day: shiftDay(1), employee: 'Yusuf Bilal', reservations: 31, opening: '08:00', closing: '18:02', hours: '10:02:10', complete: true },
      { id: 's7', day: shiftDay(1), employee: 'Frank Great', reservations: 12, opening: '08:00', closing: '08:45', hours: '00:45:00', complete: false },
      { id: 's8', day: shiftDay(1), employee: 'Mary Bassey', reservations: 40, opening: '12:00', closing: '20:00', hours: '08:00:12', complete: true },
      { id: 's9', day: shiftDay(2), employee: 'Ogechi Onyeoma', reservations: 22, opening: '09:00', closing: '17:00', hours: '08:00:30', complete: true },
      { id: 's10', day: shiftDay(2), employee: 'Raol Kane', reservations: 9, opening: '07:00', closing: '15:04', hours: '08:04:02', complete: true },
    ],
    transactions: [
      { id: 't1', at: at('18:00'), item: 'Amoxicillin suspension × 1', method: 'Online · Transfer', code: 'AB-522', paidKobo: 350_000 },
      { id: 't2', at: at('17:00'), item: 'Gestid 100ml × 3', method: 'Counter', code: 'AB-433', paidKobo: 450_000 },
      { id: 't3', at: at('16:45'), item: 'Atorvastatin 40 mg × 2', method: 'Online · Wallet', code: 'AB-524', paidKobo: 432_000 },
      { id: 't4', at: at('15:10'), item: 'Loratadine 10mg × 1', method: 'Online · Card', code: 'AB-401', paidKobo: 135_000 },
      { id: 't5', at: at('13:20'), item: 'Diovan 80 mg × 1', method: 'Counter', code: 'AB-398', paidKobo: 560_000 },
      { id: 't6', at: at('18:20', 1), item: 'Ventolin 100 mcg × 1', method: 'Online · Card', code: 'AB-389', paidKobo: 590_000 },
      { id: 't7', at: at('11:00', 1), item: 'Emzor Paracetamol 500 mg × 2', method: 'Counter', code: 'AB-371', paidKobo: 180_000 },
      { id: 't8', at: at('10:00', 6), item: 'Payout to Sterling Bank •••• 2345', method: 'Payout', code: 'PO-015', paidKobo: 19_695_000 },
    ],
    notificationsRead: false,
    clockedInAt: at('08:00'),
  };
}

function shiftDay(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const KEY = 'medfind-pharmacy-demo-v3';
const SERVER = initialState();
let state: WorkspaceState = SERVER;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let hydrated = false;
function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) state = { ...initialState(), ...(JSON.parse(saved) as Partial<WorkspaceState>) };
    // A signup application belongs to its own pharmacy. Never carry Fuasi's sample
    // transactions, shifts or inventory into a newly created owner's workspace.
    const applicationRaw = window.localStorage.getItem('medfind.pharmacy.signup.application.v1');
    if (applicationRaw) {
      const application = JSON.parse(applicationRaw) as { pharmacy?: { name?: string; phone?: string; street?: string; area?: string; city?: string; state?: string; superintendent_name?: string; pcn_number?: string }; payout?: { bank_name?: string; account_number?: string } };
      const p = application.pharmacy;
      if (p?.name && (!state.isNewPharmacy || state.pharmacy !== p.name)) {
        state = { ...initialState(), pharmacy: p.name, staffName: p.superintendent_name || '', superintendentPcn: p.pcn_number || '', address: [p.street, p.area, p.city, p.state].filter(Boolean).join(', '), phone: p.phone || '', isNewPharmacy: true, payoutBank: application.payout?.bank_name || '', payoutLast4: application.payout?.account_number?.slice(-4) || '', services: [], accepting: false, hours: { weekdays: { open: '09:00', close: '17:00', allDay: false }, saturday: { open: '09:00', close: '17:00', allDay: false }, sunday: { open: '09:00', close: '17:00', allDay: false }, holidays: { open: '09:00', close: '17:00', allDay: false } }, items: [], activity: [], employees: [], shifts: [], transactions: [], notificationsRead: true, clockedInAt: new Date().toISOString() };
        window.localStorage.setItem(KEY, JSON.stringify(state));
      }
    }
  } catch {
    /* storage blocked: the demo still works in memory */
  }
  emit();
}
if (typeof window !== 'undefined') hydrate();

function save(next: WorkspaceState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* in-memory only */
  }
  emit();
}

export function getWorkspace(): WorkspaceState {
  return state;
}

/** Change workspace data; pass `log` to add a line to Activity at the same time. */
export function updateWorkspace(change: Partial<WorkspaceState> | ((s: WorkspaceState) => Partial<WorkspaceState>), log?: Omit<ActivityEntry, 'id' | 'at' | 'employee' | 'role'>) {
  const patch = typeof change === 'function' ? change(state) : change;
  const next = { ...state, ...patch };
  if (log) next.activity = [newEntry(log), ...next.activity];
  save(next);
}

export function logActivity(entry: Omit<ActivityEntry, 'id' | 'at' | 'employee' | 'role'>) {
  save({ ...state, activity: [newEntry(entry), ...state.activity] });
}

function newEntry(entry: Omit<ActivityEntry, 'id' | 'at' | 'employee' | 'role'>): ActivityEntry {
  return { id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), employee: state.staffName, role: roleShort(state.staffRole), ...entry };
}

export function addTransaction(t: Omit<Transaction, 'id' | 'at'>) {
  save({ ...state, transactions: [{ id: `t${Date.now()}`, at: new Date().toISOString(), ...t }, ...state.transactions] });
}

/** Blank pharmacy workspace for a newly registered demo owner. */
export function startNewPharmacyWorkspace(pharmacy: string, staffName: string, address: string, phone: string) {
  save({ ...initialState(), pharmacy, staffName, address, phone, isNewPharmacy: true, superintendentPcn: '', payoutBank: '', payoutLast4: '', services: [], hours: { weekdays: { open: '09:00', close: '17:00', allDay: false }, saturday: { open: '09:00', close: '17:00', allDay: false }, sunday: { open: '09:00', close: '17:00', allDay: false }, holidays: { open: '09:00', close: '17:00', allDay: false } }, accepting: false, items: [], activity: [], employees: [], shifts: [], transactions: [], notificationsRead: true, clockedInAt: new Date().toISOString() });
}

export function resetWorkspace() {
  save(initialState());
}

export function useWorkspace(): WorkspaceState {
  useEffect(() => hydrate(), []);
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

export function roleShort(role: Role): string {
  return role === 'Superintendent pharmacist' ? 'Superintendent' : role === 'Manager/ Pharmacist' ? 'Manager' : role;
}

export function stockStatus(i: StockItem): StockStatus {
  return i.quantity === 0 ? 'out' : i.quantity <= 10 ? 'low' : 'in';
}

/** A new random 5-digit staff code that no one else has. */
export function newStaffCode(taken: string[]): string {
  let code = '';
  do code = String(Math.floor(10000 + Math.random() * 90000));
  while (taken.includes(code));
  return code;
}
