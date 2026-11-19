import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertValidLocation, type CustomerLocation } from '@medfind/core';
import { currentCustomerId, supabase } from './supabase';

const KEY = 'medfind.location';

function isLocation(v: unknown): v is CustomerLocation {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  return typeof l.label === 'string' && typeof l.lat === 'number' && typeof l.lng === 'number' &&
    (l.source === 'gps' || l.source === 'address');
}

async function loadLocal(): Promise<CustomerLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    return isLocation(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * The customer's saved location. Signed in, public.customer_locations is the source of truth;
 * the phone keeps a copy so the check after log in is quick and works offline.
 */
export async function loadSavedLocation(): Promise<CustomerLocation | null> {
  const customerId = await currentCustomerId();
  if (supabase && customerId) {
    const { data, error } = await supabase
      .from('customer_locations')
      .select('label, address_line, lat, lng, accuracy_m, source')
      .eq('customer_id', customerId)
      .maybeSingle();
    if (!error) {
      if (!data) return null;
      const loc: CustomerLocation = {
        label: data.label,
        addressLine: data.address_line,
        lat: data.lat,
        lng: data.lng,
        accuracyM: data.accuracy_m,
        source: data.source === 'address' ? 'address' : 'gps',
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(loc)).catch(() => {});
      return loc;
    }
    // Offline or the server failed: fall back to the copy on the phone.
  }
  return loadLocal();
}

/**
 * Saves the location on the phone and, when signed in, to Supabase.
 * Resolves `synced: false` if it couldn't reach Supabase (the phone copy is still saved).
 */
export async function saveLocation(loc: CustomerLocation): Promise<{ synced: boolean }> {
  assertValidLocation(loc);
  await AsyncStorage.setItem(KEY, JSON.stringify(loc)).catch(() => {});
  const customerId = await currentCustomerId();
  if (!supabase || !customerId) return { synced: false };
  const { error } = await supabase.from('customer_locations').upsert({
    customer_id: customerId,
    label: loc.label,
    address_line: loc.addressLine,
    lat: loc.lat,
    lng: loc.lng,
    accuracy_m: loc.source === 'gps' ? loc.accuracyM : null,
    source: loc.source,
  });
  return { synced: !error };
}
