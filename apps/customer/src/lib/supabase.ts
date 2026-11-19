import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medfind/core';

/**
 * The Supabase client, or null when the app has no Supabase settings yet.
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/customer/.env.local
 * (see .env.example). The anon key is public by design; row-level security protects the data.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

const DEMO_SIGNED_IN = 'medfind.demoSignedIn';

/**
 * Sign-in runs in demo mode (any details work, signs in as Grace) when Supabase isn't set up,
 * and always in the hosted web demo, which has Supabase only for the live pharmacy channel.
 */
export const demoAuth = !supabase || Platform.OS === 'web';

/** Without Supabase (the hosted web demo), logging in or signing up signs in as Grace. */
export async function setDemoSignedIn(on: boolean): Promise<void> {
  try {
    if (on) await AsyncStorage.setItem(DEMO_SIGNED_IN, '1');
    else await AsyncStorage.removeItem(DEMO_SIGNED_IN);
  } catch {
    // Storage can be blocked (private browsing); the demo then signs in for this visit only.
  }
  demoSignedIn = on;
}
let demoSignedIn = false;

/** The signed-in customer's id, or null when signed out. */
export async function currentCustomerId(): Promise<string | null> {
  if (demoAuth || !supabase) {
    let stored: string | null = null;
    try {
      stored = await AsyncStorage.getItem(DEMO_SIGNED_IN);
    } catch {
      // ignore
    }
    return demoSignedIn || stored ? 'demo-grace' : null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
