import { homeRouteFor, routeAfterAuth, type AuthEntry, type HomeRoute } from '@medfind/core';
import type { Href } from 'expo-router';
import { permissionState } from './deviceLocation';
import { loadSavedLocation } from './locationStore';

export function homeHref(route: HomeRoute): Href {
  return route === 'home_new_user' ? { pathname: '/', params: { newUser: '1' } } : '/';
}

export function homeHrefFor(entry: AuthEntry): Href {
  return homeHref(homeRouteFor(entry));
}

/**
 * Where to go straight after sign-up verification (`sign_up`) or log in (`log_in`).
 * The sign-up and log-in screens call this and `router.replace` the result.
 */
export async function hrefAfterAuth(entry: AuthEntry): Promise<Href> {
  const [perm, saved] = await Promise.all([permissionState(), loadSavedLocation()]);
  const route = routeAfterAuth(entry, { permissionOn: perm === 'on', hasSavedLocation: saved !== null });
  return route === 'location_access' ? { pathname: '/location', params: { entry } } : homeHref(route);
}
