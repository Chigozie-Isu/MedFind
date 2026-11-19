import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { describeGpsFix, type CustomerLocation } from '@medfind/core';

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

export async function permissionState(): Promise<PermissionState> {
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
