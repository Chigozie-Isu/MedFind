import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
const KEY = 'medfind.demo.savedMedicines.v1';
let saved: string[] = [];
let loaded = false;
const listeners = new Set<(items: string[]) => void>();
export async function loadSavedMedicines(): Promise<string[]> {
  if (!loaded) {
    loaded = true;
    try { const raw = await AsyncStorage.getItem(KEY); if (raw) { const value: unknown = JSON.parse(raw); if (Array.isArray(value)) saved = value.filter((x): x is string => typeof x === 'string'); } } catch { /* fallback */ }
    listeners.forEach((fn) => fn(saved));
  }
  return saved;
}
export async function toggleSavedMedicine(id: string): Promise<void> {
  await loadSavedMedicines();
  saved = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
  try { await AsyncStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* fallback */ }
  listeners.forEach((fn) => fn(saved));
}
export async function resetSavedMedicines(): Promise<void> {
  saved = []; loaded = true;
  try { await AsyncStorage.removeItem(KEY); } catch { /* fallback */ }
  listeners.forEach((fn) => fn(saved));
}
export function useSavedMedicines(): string[] {
  const [items, setItems] = useState(saved);
  useEffect(() => {
    let active = true;
    listeners.add(setItems);
    loadSavedMedicines().then((next) => { if (active) setItems(next); });
    return () => { active = false; listeners.delete(setItems); };
  }, []);
  return items;
}
