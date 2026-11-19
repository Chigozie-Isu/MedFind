import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { describeAddress, describeGpsFix, type CustomerLocation } from '@medfind/core';

/**
 * Wrappers around expo-location for the Location access screens.
 * Only foreground ("while using the app") permission is ever asked for.
 */

export type PermissionState =
  /** Location services on and permission granted. */
  | 'on'
  /** We can show the system prompt. */
  | 'can_ask'
  /** Denied for good, or location services are switched off on the phone. */
  | 'off';

/*
 * The hosted web demo can't use real GPS, so on the web the Location access screens run
 * against a pretend phone: "Allow location access" shows a copy of the iPhone prompt
 * (Figma "Location – system prompt"), Allow finds Grace in GRA Phase 2, Don't Allow shows
 * "Location is turned off", and address search uses the Figma suggestions.
 */
const isWeb = Platform.OS === 'web';
let webPermission: PermissionState = 'can_ask';
type PromptListener = (resolve: (allowed: boolean) => void) => void;
let promptListener: PromptListener | null = null;

/** The web prompt component registers here (see WebLocationPrompt). */
export function onWebLocationPrompt(l: PromptListener | null): void {
  promptListener = l;
}

async function askWeb(): Promise<PermissionState> {
  const allowed = await new Promise<boolean>((resolve) => (promptListener ? promptListener(resolve) : resolve(true)));
  webPermission = allowed ? 'on' : 'off';
  return webPermission;
}

/** Back to "never asked" (after sign out), so the next sign-up shows the prompt again. */
export function resetWebLocation(): void {
  webPermission = 'can_ask';
}

const WEB_FIX: CustomerLocation = {
  label: 'GRA Phase 2',
  addressLine: 'Port Harcourt, Rivers · within 20 m',
  lat: 4.8265,
  lng: 7.0118,
  accuracyM: 20,
  source: 'gps',
};

const WEB_SUGGESTIONS: Array<[string, string, number, number]> = [
  ['12 Ada George Road', 'Mgbuoba, Port Harcourt, Rivers', 4.8406, 6.9781],
  ['Ada George Junction', 'Rumuolumeni, Port Harcourt, Rivers', 4.8432, 6.9712],
  ['Ada George Market', 'Obio-Akpor, Rivers', 4.8461, 6.9688],
  ['Ada George Estate', 'Rumuokwuta, Port Harcourt, Rivers', 4.8383, 6.9805],
  ['24 Aba Road', 'Port Harcourt, Rivers', 4.8242, 7.0336],
  ['5 Trans-Amadi Road', 'Port Harcourt, Rivers', 4.8131, 7.0362],
  ['50 Evo Road', 'GRA Phase 2, Port Harcourt, Rivers', 4.8156, 7.0034],
];

export async function permissionState(): Promise<PermissionState> {
  if (isWeb) return webPermission;
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.granted && servicesOn) return 'on';
    if (!servicesOn) return 'off';
    return perm.canAskAgain ? 'can_ask' : 'off';
  } catch {
    return 'off';
  }
}

/** Shows the system prompt (or re-checks if it can't be shown). Resolves the new state. */
export async function askForPermission(): Promise<PermissionState> {
  if (isWeb) return askWeb();
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return perm.canAskAgain ? 'can_ask' : 'off';
    return (await Location.hasServicesEnabledAsync()) ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

/**
 * "Turn on location": asks again if it can; on Android offers the switch for location
 * services; otherwise opens MedFind's page in the phone's Settings.
 */
export async function turnOnLocation(): Promise<PermissionState> {
  if (isWeb) return askWeb();
  const servicesOn = await Location.hasServicesEnabledAsync().catch(() => false);
  if (!servicesOn && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // The customer said no to the switch.
    }
  }
  const perm = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (perm && !perm.granted && perm.canAskAgain) return askForPermission();
  const state = await permissionState();
  if (state !== 'on' && Platform.OS !== 'web') await Linking.openSettings().catch(() => {});
  return state;
}

async function reverse(lat: number, lng: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return place ?? {};
  } catch {
    // Not available (e.g. on the web without a Google key): fall back to a plain label.
    return {};
  }
}

/** Gets a GPS fix and turns it into a saved-location shape ("GRA Phase 2", "Port Harcourt · within 20 m"). */
export async function findCurrentLocation(): Promise<CustomerLocation> {
  if (isWeb) {
    await new Promise((r) => setTimeout(r, 1500));
    if (webPermission !== 'on') throw new Error('Could not get your location');
    return WEB_FIX;
  }
  let pos: Location.LocationObject | null = null;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    pos = await Location.getLastKnownPositionAsync().catch(() => null);
  }
  if (!pos) throw new Error('Could not get your location');
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  const accuracyM = accuracy ?? null;
  const { label, addressLine } = describeGpsFix(await reverse(lat, lng), accuracyM);
  return { label, addressLine: addressLine || null, lat, lng, accuracyM, source: 'gps' };
}

/** Address search: the phone's own geocoder, or the demo suggestions on the web. */
export const canSearchAddresses = true;

/**
 * Address suggestions from the phone's built-in geocoder (free; Apple on iOS, Google's
 * on-device geocoder on Android). Biased to Nigeria by appending the country.
 */
export async function searchAddresses(query: string, limit = 5): Promise<CustomerLocation[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (isWeb) {
    const words = q.toLowerCase().split(/\s+/);
    return WEB_SUGGESTIONS.filter(([a, b]) => words.every((w) => `${a} ${b}`.toLowerCase().includes(w)))
      .slice(0, limit)
      .map(([label, addressLine, lat, lng]) => ({ label, addressLine, lat, lng, accuracyM: null, source: 'address' as const }));
  }
  const withCountry = /nigeria/i.test(q) ? q : `${q}, Nigeria`;
  const hits = await Location.geocodeAsync(withCountry);
  const out: CustomerLocation[] = [];
  const seen = new Set<string>();
  for (const h of hits.slice(0, limit)) {
    const place = await reverse(h.latitude, h.longitude);
    const { label, addressLine } = describeAddress(place);
    const key = `${label}|${addressLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, addressLine: addressLine || null, lat: h.latitude, lng: h.longitude, accuracyM: null, source: 'address' });
  }
  return out;
}
