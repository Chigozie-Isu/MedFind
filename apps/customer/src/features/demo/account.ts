/**
 * Grace's account for the demo: profile, wallet, cards, addresses, saved medicines,
 * notification settings and the checkout in progress. Kept in memory until the app restarts.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Fulfilment } from '@medfind/core';
import type { DemoPaymentMethod } from '@medfind/core';
import {
  WALLET_SEED_KOBO,
  addressesSeed,
  cardsSeed,
  profileSeed,
  walletSeed,
  type DemoAddress,
  type DemoCard,
  type DemoWalletEntry,
} from './data';

export interface SavedMedicine {
  medicineId: string;
  /** Where to reserve it again. */
  inventoryId: string;
  savedAt: Date;
}

export interface Checkout {
  inventoryId: string;
  quantity: number;
  fulfilment: Fulfilment;
  /** "Pay online now" or "Pay at pharmacy". */
  payOnline: boolean;
  addressId: string;
  prescriptionAttached: boolean;
}

export interface NotificationPrefs {
  reservations: boolean;
  reminders: boolean;
  stock: boolean;
  refills: boolean;
  offers: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface Account {
  profile: typeof profileSeed;
  walletKobo: number;
  wallet: DemoWalletEntry[];
  walletFirst: boolean;
  cards: DemoCard[];
  defaultCardId: string;
  addresses: DemoAddress[];
  defaultAddressId: string;
  saved: SavedMedicine[];
  recentSearches: string[];
  notifications: NotificationPrefs;
  unreadNotifications: number;
  stockAlerts: string[];
  checkout: Checkout | null;
  /** Method picked on the Payment screen. */
  method: DemoPaymentMethod | null;
}

const day = 86_400_000;
const seed = (): Account => ({
  profile: { ...profileSeed },
  walletKobo: WALLET_SEED_KOBO,
  wallet: walletSeed,
  walletFirst: false,
  cards: cardsSeed,
  defaultCardId: 'visa',
  addresses: addressesSeed,
  defaultAddressId: 'home',
  saved: [
    { medicineId: 'diclofenac', inventoryId: 'fuasi:diclofenac', savedAt: new Date(Date.now() - 38 * day) },
    { medicineId: 'gestid', inventoryId: 'caduces:gestid', savedAt: new Date(Date.now() - 39 * day) },
  ],
  /** "Gestad" in Figma is a typo for Gestid. */
  recentSearches: ['Gestid', 'Actifed', 'Diclofenac'],
  notifications: { reservations: true, reminders: true, stock: true, refills: true, offers: false, push: true, email: true, sms: false },
  unreadNotifications: 2,
  stockAlerts: [],
  checkout: null,
  method: null,
});
let state: Account = seed();

const ACCOUNT_KEY = 'medfind.customer.account.v2';
let hydrated = false;
export async function hydrateAccount(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Account;
    state = {
      ...seed(), ...stored,
      saved: (stored.saved ?? []).map(s => ({ ...s, savedAt: new Date(s.savedAt) })),
    };
    listeners.forEach(l => l());
  } catch { /* use default demo state if storage is unavailable */ }
}
function persistAccount() {
  void AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(state)).catch(() => {});
}
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setAccount(change: Partial<Account> | ((a: Account) => Partial<Account>)): void {
  state = { ...state, ...(typeof change === 'function' ? change(state) : change) };
  persistAccount();
  listeners.forEach((l) => l());
}

export const getAccount = () => state;

/** Settings > Reset demo data: puts Grace's account back to how the demo starts. */
export function startNewCustomerAccount(): void {
  state = {
    ...seed(),
    profile: { ...profileSeed, fullName: '', displayName: '', email: '', phone: '', maskedPhone: '', dob: { d: '', m: '', y: '' }, allergies: '' },
    walletKobo: 0,
    wallet: [],
    cards: [],
    defaultCardId: '',
    addresses: [],
    defaultAddressId: '',
    saved: [],
    recentSearches: [],
    unreadNotifications: 0,
    stockAlerts: [],
  };
  persistAccount();
  listeners.forEach((l) => l());
}

export function resetAccount(): void {
  state = seed();
  persistAccount();
  listeners.forEach((l) => l());
}

export function useAccount(): Account {
  return useSyncExternalStore(subscribe, () => state);
}

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

/** Adds a wallet entry and moves the balance (positive = money in). */
export function walletMove(title: string, amountKobo: number, kind: DemoWalletEntry['kind']): void {
  setAccount((a) => ({
    walletKobo: a.walletKobo + amountKobo,
    wallet: [{ id: `w${Date.now()}`, title, date: today(), amountKobo, kind }, ...a.wallet],
  }));
}

export function saveMedicine(medicineId: string, inventoryId: string): void {
  setAccount((a) =>
    a.saved.some((s) => s.medicineId === medicineId)
      ? {}
      : { saved: [{ medicineId, inventoryId, savedAt: new Date() }, ...a.saved] },
  );
}

export function rememberSearch(q: string): void {
  const t = q.trim();
  if (!t) return;
  const word = t[0].toUpperCase() + t.slice(1);
  setAccount((a) => ({ recentSearches: [word, ...a.recentSearches.filter((s) => s.toLowerCase() !== word.toLowerCase())].slice(0, 3) }));
}

export const defaultCard = (a: Account): DemoCard | undefined => a.cards.find((c) => c.id === a.defaultCardId) ?? a.cards[0];
export const defaultAddress = (a: Account): DemoAddress | undefined => a.addresses.find((x) => x.id === a.defaultAddressId) ?? a.addresses[0];
export const cardLabel = (c: DemoCard) => `${c.brand} •••• ${c.last4}`;
