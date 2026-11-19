import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import type { AuthEntry, CustomerLocation } from '@medfind/core';
import { LocationFlow } from '../../features/location/LocationFlow';
import { homeHrefFor } from '../../lib/afterAuth';
import { saveLocation } from '../../lib/locationStore';

/**
 * /location?entry=sign_up|log_in — shown after sign-up verification or log in when
 * location permission is off or there is no saved location (see hrefAfterAuth).
 */
export default function LocationAccess() {
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const from: AuthEntry = entry === 'sign_up' ? 'sign_up' : 'log_in';
  const onDone = useCallback(
    async (loc: CustomerLocation) => {
      await saveLocation(loc);
      router.replace(homeHrefFor(from));
    },
    [from],
  );
  return <LocationFlow onDone={onDone} />;
}
