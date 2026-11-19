// Address search for the customer app's Location access screens, via Google Places API (New).
// The Google key never leaves the server: set GOOGLE_PLACES_API_KEY with
// `supabase secrets set` (production) or in supabase/functions/.env (local).
//
// POST { action: 'autocomplete', input, sessionToken, near?: { lat, lng } } -> { suggestions }
// POST { action: 'details', placeId, sessionToken }                      -> { place }
// Signed-in customers only (Supabase checks the JWT; we also require the authenticated role).
import { isValidInput, PLACE_ID_RE, SESSION_TOKEN_RE, toPlaceDetails, toSuggestions } from './map.ts';

const KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
// Overridable only so tests can point at a stand-in server.
const BASE = Deno.env.get('GOOGLE_PLACES_BASE_URL') ?? 'https://places.googleapis.com/v1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Role from the (already verified) Supabase JWT. */
function roleOf(req: Request): string | null {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))).role ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (roleOf(req) !== 'authenticated') return json({ error: 'sign_in_required' }, 401);
  if (!KEY) return json({ error: 'not_configured' }, 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const sessionToken = typeof body.sessionToken === 'string' && SESSION_TOKEN_RE.test(body.sessionToken) ? body.sessionToken : undefined;

  try {
    if (body.action === 'autocomplete') {
      if (!isValidInput(body.input)) return json({ error: 'bad_request' }, 400);
      const near = body.near as { lat?: unknown; lng?: unknown } | undefined;
      const hasNear = typeof near?.lat === 'number' && typeof near?.lng === 'number';
      const r = await fetch(`${BASE}/places:autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
        body: JSON.stringify({
          input: body.input.trim(),
          includedRegionCodes: ['ng'],
          languageCode: 'en',
          sessionToken,
          ...(hasNear && { locationBias: { circle: { center: { latitude: near!.lat, longitude: near!.lng }, radius: 50000 } } }),
        }),
      });
      if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
      return json({ suggestions: toSuggestions(await r.json()) });
    }

    if (body.action === 'details') {
      if (typeof body.placeId !== 'string' || !PLACE_ID_RE.test(body.placeId)) return json({ error: 'bad_request' }, 400);
      const qs = new URLSearchParams({ languageCode: 'en', ...(sessionToken && { sessionToken }) });
      const r = await fetch(`${BASE}/places/${body.placeId}?${qs}`, {
        headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents' },
      });
      if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
      return json({ place: toPlaceDetails(await r.json()) });
    }

    return json({ error: 'bad_request' }, 400);
  } catch {
    return json({ error: 'upstream' }, 502);
  }
});
