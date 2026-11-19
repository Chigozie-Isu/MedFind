'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medfind/core';

/**
 * The browser Supabase client, or null when the app has no Supabase settings yet.
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/pharmacy/.env.local
 * (see .env.example). The anon key is public by design; row-level security protects the data.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseUrl = url ?? '';
export const supabaseAnonKey = anonKey ?? '';

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const NOT_SET_UP = 'MedFind isn’t connected yet. Add the Supabase settings in apps/pharmacy/.env.local.';
export const OFFLINE = 'We couldn’t reach MedFind. Check your connection and try again.';

export function client(): SupabaseClient<Database> {
  if (!supabase) throw new Error(NOT_SET_UP);
  return supabase;
}

export type ApiResult<T = void> = { ok: true; value: T } | { ok: false; reason: string; lockedSeconds?: number };

export async function attempt<T>(fn: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return { ok: false, reason: e instanceof Error && e.message === NOT_SET_UP ? NOT_SET_UP : OFFLINE };
  }
}

/** The signed-in staff member's pharmacy and where its application is. */
export interface StaffState {
  staff_id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  role: string;
  application_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  has_passcode: boolean;
  passcode_locked_seconds: number;
}

export async function myStaffState(): Promise<StaffState | null> {
  if (!supabase) return null;
  const { data } = await supabase.rpc('my_staff_state');
  return (data as StaffState | null) ?? null;
}
