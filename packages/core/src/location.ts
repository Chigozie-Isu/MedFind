/**
 * Location access rules for the customer app.
 *
 * After sign-up verification and after log in, the customer sees the Location access
 * screens if location permission is off or they have no saved location. Otherwise they
 * go straight to Home. New customers (coming from sign-up) land on Home (new user).
 */

/** Where the customer came from when the check runs. */
export type AuthEntry = 'sign_up' | 'log_in';

/** What the app knows about location when the check runs. */
export interface LocationStatus {
  /** The phone's location services are on and MedFind has permission to use them. */
  permissionOn: boolean;
  /** The customer has a saved location (from GPS or a typed address). */
  hasSavedLocation: boolean;
}

export type HomeRoute = 'home' | 'home_new_user';
export type AfterAuthRoute = 'location_access' | HomeRoute;

/** Which Home a customer lands on, depending on how they arrived. */
export function homeRouteFor(entry: AuthEntry): HomeRoute {
  return entry === 'sign_up' ? 'home_new_user' : 'home';
}

/** Where to send a customer straight after sign-up verification or log in. */
export function routeAfterAuth(entry: AuthEntry, status: LocationStatus): AfterAuthRoute {
  if (!status.permissionOn || !status.hasSavedLocation) return 'location_access';
  return homeRouteFor(entry);
}

/** Where the saved location came from. */
export type LocationSource = 'gps' | 'address';

/** A customer's saved location, as stored in public.customer_locations. */
export interface CustomerLocation {
  label: string;
  /** Second line under the label, e.g. "Mgbuoba, Port Harcourt, Rivers". */
  addressLine: string | null;
  lat: number;
  lng: number;
  /** GPS accuracy radius in metres; null for a typed address. */
  accuracyM: number | null;
  source: LocationSource;
}

/** Throws if the location can't be saved (bad coordinates, empty label, negative accuracy). */
export function assertValidLocation(loc: CustomerLocation): void {
  if (!loc.label.trim()) throw new Error('Location needs a label');
  if (!Number.isFinite(loc.lat) || loc.lat < -90 || loc.lat > 90) throw new Error(`Bad latitude: ${loc.lat}`);
  if (!Number.isFinite(loc.lng) || loc.lng < -180 || loc.lng > 180) throw new Error(`Bad longitude: ${loc.lng}`);
  if (loc.accuracyM !== null && (!Number.isFinite(loc.accuracyM) || loc.accuracyM < 0)) {
    throw new Error(`Bad accuracy: ${loc.accuracyM}`);
  }
}

/**
 * "within 20 m" / "within 1.2 km", as shown under a GPS location.
 * Rounds up so the promise is never tighter than the phone reported.
 */
export function formatAccuracy(accuracyM: number): string {
  if (!Number.isFinite(accuracyM) || accuracyM < 0) throw new Error(`Bad accuracy: ${accuracyM}`);
  if (accuracyM < 1000) {
    const step = accuracyM < 100 ? 5 : 10;
    return `within ${Math.max(step, Math.ceil(accuracyM / step) * step)} m`;
  }
  return `within ${(Math.ceil(accuracyM / 100) / 10).toFixed(1).replace(/\.0$/, '')} km`;
}

/** The parts of a reverse-geocoded address MedFind uses (matches expo-location's fields). */
export interface GeocodedPlace {
  name?: string | null;
  streetNumber?: string | null;
  street?: string | null;
  district?: string | null;
  subregion?: string | null;
  city?: string | null;
  region?: string | null;
}

const clean = (s: string | null | undefined) => (s ?? '').trim();
const uniqueJoin = (parts: (string | null | undefined)[], sep: string) => {
  const out: string[] = [];
  for (const p of parts.map(clean)) if (p && !out.includes(p)) out.push(p);
  return out.join(sep);
};

/** Label and second line for a typed or picked address, e.g. "12 Ada George Road" / "Mgbuoba, Port Harcourt, Rivers". */
export function describeAddress(place: GeocodedPlace): { label: string; addressLine: string } {
  const street = uniqueJoin([place.streetNumber, place.street], ' ');
  const label = street || clean(place.name) || clean(place.district) || clean(place.city) || 'Pinned location';
  const addressLine = uniqueJoin([place.district, place.city ?? place.subregion, place.region], ', ')
    .split(', ')
    .filter((p) => p !== label)
    .join(', ');
  return { label, addressLine };
}

/** Label used when the phone can't name the place around a GPS fix. */
export const GPS_FALLBACK_LABEL = 'Your location';

/** Label and second line for a GPS fix, e.g. "GRA Phase 2" / "Port Harcourt · within 20 m". */
export function describeGpsFix(place: GeocodedPlace, accuracyM: number | null): { label: string; addressLine: string } {
  const label = clean(place.district) || clean(place.street) || clean(place.name) || clean(place.city) || GPS_FALLBACK_LABEL;
  const city = clean(place.city) || clean(place.subregion) || clean(place.region);
  const parts = [city !== label ? city : '', accuracyM !== null ? formatAccuracy(accuracyM) : ''].filter(Boolean);
  return { label, addressLine: parts.join(' · ') };
}
