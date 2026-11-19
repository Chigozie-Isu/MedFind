import AsyncStorage from '@react-native-async-storage/async-storage';
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

/** The signed-in customer's id, or null when signed out (or Supabase isn't set up). */
export async function currentCustomerId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
