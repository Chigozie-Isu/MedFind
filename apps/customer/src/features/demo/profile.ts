import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface DemoProfile {
  name: string;
  email: string;
  phone: string;
}
const KEY = 'medfind.demo.profile.v1';
const DEFAULT: DemoProfile = { name: 'Grace Mary', email: '', phone: '' };
let current: DemoProfile = DEFAULT;
let loaded = false;
const listeners = new Set<(profile: DemoProfile) => void>();

export async function loadDemoProfile(): Promise<DemoProfile> {
  if (!loaded) {
    loaded = true;
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved) current = { ...DEFAULT, ...(JSON.parse(saved) as Partial<DemoProfile>) };
    } catch { /* Keep the demo usable without storage. */ }
  }
  return current;
}

export async function saveDemoProfile(change: Partial<DemoProfile>): Promise<DemoProfile> {
  await loadDemoProfile();
  current = { ...current, ...change };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(current)); } catch { /* In-memory fallback */ }
  listeners.forEach((listener) => listener(current));
  return current;
}

export async function resetDemoProfile(): Promise<void> {
  current = DEFAULT;
  loaded = true;
  try { await AsyncStorage.removeItem(KEY); } catch { /* In-memory fallback */ }
  listeners.forEach((listener) => listener(current));
}

export function useDemoProfile(): DemoProfile {
  const [profile, setProfile] = useState<DemoProfile>(current);
  useEffect(() => {
    let mounted = true;
    listeners.add(setProfile);
    loadDemoProfile().then((value) => { if (mounted) setProfile(value); });
    return () => { mounted = false; listeners.delete(setProfile); };
  }, []);
  return profile;
}
