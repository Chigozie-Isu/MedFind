import type { CustomerLocation } from '@medfind/core';
import { supabase } from './supabase';

/**
 * Address search through the `places` edge function (Google Places autocomplete).
 * The Google key stays on the server; the app only ever talks to Supabase.
 */
export interface PlaceSuggestion {
  placeId: string;
  label: string;
  addressLine: string;
}

export type PlacesError = 'not_set_up' | 'sign_in_required' | 'failed';

export class PlacesUnavailable extends Error {
  constructor(public reason: PlacesError) {
    super(reason);
  }
}

/** A Places session groups the keystrokes and the final pick into one billed session. */
export function newPlacesSession(): string {
  let t = '';
  for (let i = 0; i < 32; i++) t += Math.floor(Math.random() * 16).toString(16);
  return t;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new PlacesUnavailable('not_set_up');
  const { data, error } = await supabase.functions.invoke('places', { body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    throw new PlacesUnavailable(status === 401 ? 'sign_in_required' : status === 503 ? 'not_set_up' : 'failed');
  }
  return data as T;
}

export async function searchPlaces(
  input: string,
  sessionToken: string,
  near?: { lat: number; lng: number },
): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 3) return [];
  const { suggestions } = await call<{ suggestions: PlaceSuggestion[] }>({ action: 'autocomplete', input: input.trim(), sessionToken, near });
  return suggestions;
}

/** Looks up the picked suggestion's coordinates and returns it ready to save. */
export async function placeToLocation(placeId: string, sessionToken: string): Promise<CustomerLocation> {
  const { place } = await call<{ place: PlaceSuggestion & { lat: number; lng: number } }>({ action: 'details', placeId, sessionToken });
  return { label: place.label, addressLine: place.addressLine || null, lat: place.lat, lng: place.lng, accuracyM: null, source: 'address' };
}
