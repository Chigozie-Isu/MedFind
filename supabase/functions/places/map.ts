/**
 * Turns Google Places API (New) responses into what the MedFind app shows.
 * Plain TypeScript with no Deno APIs, so Node can unit-test it too.
 */

export interface PlaceSuggestion {
  placeId: string;
  /** "12 Ada George Road" */
  label: string;
  /** "Mgbuoba, Port Harcourt, Rivers" */
  addressLine: string;
}

export interface PlaceDetails extends PlaceSuggestion {
  lat: number;
  lng: number;
}

interface GText { text?: string }
interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      text?: GText;
      structuredFormat?: { mainText?: GText; secondaryText?: GText };
    };
  }[];
}
interface AddressComponent { longText?: string; shortText?: string; types?: string[] }
interface DetailsResponse {
  id?: string;
  displayName?: GText;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: AddressComponent[];
}

const clean = (s: string | undefined) => (s ?? '').trim();
/** Google adds ", Nigeria" to every result; the app is Nigeria-only, so drop it. */
const dropCountry = (s: string) => s.replace(/,?\s*Nigeria$/i, '').trim();
const uniqueJoin = (parts: string[], sep: string, skip: string) => {
  const out: string[] = [];
  for (const p of parts.map((x) => x.trim())) if (p && p !== skip && !out.includes(p)) out.push(p);
  return out.join(sep);
};

export function toSuggestions(res: AutocompleteResponse, limit = 5): PlaceSuggestion[] {
  const out: PlaceSuggestion[] = [];
  for (const s of res.suggestions ?? []) {
    const p = s.placePrediction;
    if (!p?.placeId) continue;
    const label = clean(p.structuredFormat?.mainText?.text) || dropCountry(clean(p.text?.text));
    if (!label) continue;
    out.push({ placeId: p.placeId, label, addressLine: dropCountry(clean(p.structuredFormat?.secondaryText?.text)) });
    if (out.length >= limit) break;
  }
  return out;
}

export function toPlaceDetails(res: DetailsResponse): PlaceDetails {
  const lat = res.location?.latitude;
  const lng = res.location?.longitude;
  if (!res.id || typeof lat !== 'number' || typeof lng !== 'number') throw new Error('Place has no location');
  const comp = (type: string) => clean(res.addressComponents?.find((c) => c.types?.includes(type))?.longText);
  const street = [comp('street_number'), comp('route')].filter(Boolean).join(' ');
  const label = street || clean(res.displayName?.text) || dropCountry(clean(res.formattedAddress)).split(',')[0]?.trim() || 'Pinned location';
  const area = comp('sublocality') || comp('sublocality_level_1') || comp('neighborhood');
  const addressLine = uniqueJoin([area, comp('locality') || comp('administrative_area_level_2'), comp('administrative_area_level_1')], ', ', label);
  return { placeId: res.id, label, addressLine, lat, lng };
}

/** Request checks shared by the function and its tests. */
export const PLACE_ID_RE = /^[A-Za-z0-9_-]{1,300}$/;
export const SESSION_TOKEN_RE = /^[A-Za-z0-9-]{8,64}$/;
export function isValidInput(input: unknown): input is string {
  return typeof input === 'string' && input.trim().length >= 3 && input.length <= 120;
}
