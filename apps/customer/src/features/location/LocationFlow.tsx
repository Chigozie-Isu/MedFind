import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, sizes, space, webText } from '@medfind/ui';
import { Button, Icon, SearchField, Text, textStyle, useTheme } from '@medfind/ui/native';
import { GPS_FALLBACK_LABEL, type CustomerLocation } from '@medfind/core';
import {
  askForPermission,
  findCurrentLocation,
  permissionState,
  turnOnLocation,
} from '../../lib/deviceLocation';
import { newPlacesSession, placeToLocation, PlacesUnavailable, searchPlaces, type PlaceSuggestion } from '../../lib/places';
import { AddressLink, Benefit, IllustratedScreen, LocationCard, SuggestionRow } from './parts';

/**
 * Location access (Figma section 2677:160663 light, 2679:160877 dark).
 * Steps: allow access → (system prompt) → finding you → found; or turned off; or
 * enter address → address set. Continue hands the chosen location to `onDone`.
 */
export type LocationStep = 'checking' | 'allow' | 'finding' | 'found' | 'off' | 'address' | 'address_set';

export interface LocationFlowProps {
  onDone: (location: CustomerLocation) => Promise<void> | void;
  /** Start on a given step (used by the dev screen to preview each one). */
  initialStep?: LocationStep;
  /** Preview data for the found / address set steps. */
  initialLocation?: CustomerLocation;
}

export function LocationFlow({ onDone, initialStep = 'checking', initialLocation }: LocationFlowProps) {
  const [step, setStep] = useState<LocationStep>(initialStep);
  const [location, setLocation] = useState<CustomerLocation | null>(initialLocation ?? null);
  const [saving, setSaving] = useState(false);
  // Where the address screen's back chevron returns to.
  const [beforeAddress, setBeforeAddress] = useState<LocationStep>('allow');

  const locate = useCallback(async () => {
    setStep('finding');
    try {
      const loc = await findCurrentLocation();
      setLocation(loc);
      setStep('found');
    } catch {
      setStep('off');
    }
  }, []);

  const route = useCallback(
    async (state: Awaited<ReturnType<typeof permissionState>>) => {
      if (state === 'on') return locate();
      setStep(state === 'can_ask' ? 'allow' : 'off');
    },
    [locate],
  );

  // First check: permission already on (but nothing saved) goes straight to finding you.
  useEffect(() => {
    if (initialStep === 'checking') permissionState().then(route);
  }, [initialStep, route]);

  // Back from the phone's Settings on the "turned off" screen: check again.
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && stepRef.current === 'off') {
        permissionState().then((p) => (p === 'on' ? locate() : undefined));
      }
    });
    return () => sub.remove();
  }, [locate]);

  const openAddress = useCallback(() => {
    setBeforeAddress(step === 'address_set' ? 'allow' : step);
    setStep('address');
  }, [step]);

  // Android back button on the address screen goes back a step, not out of the flow.
  useEffect(() => {
    if (step !== 'address' || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(beforeAddress);
      return true;
    });
    return () => sub.remove();
  }, [step, beforeAddress]);

  const finish = useCallback(async () => {
    if (!location) return;
    setSaving(true);
    try {
      await onDone(location);
    } finally {
      setSaving(false);
    }
  }, [location, onDone]);

  switch (step) {
    case 'checking':
      return <Checking />;
    case 'allow':
      return (
        <IllustratedScreen
          illustration="base"
          title="Find pharmacies nearby"
          body="Allow location access so MedFind can show pharmacies around you that have your medicine in stock."
          footerHasLink
          footer={
            <>
              <Button label="Allow location access" fullWidth onPress={() => askForPermission().then(route)} />
              <AddressLink onPress={openAddress} />
            </>
          }
        >
          <View style={styles.benefits}>
            <Benefit icon="location" text="See how far each pharmacy is" />
            <Benefit icon="home-2" text="Get deliveries to the right door" />
            <Benefit icon="shield-tick" text="Only used while you use MedFind, never sold" />
          </View>
        </IllustratedScreen>
      );
    case 'finding':
      return (
        <IllustratedScreen
          illustration="finding"
          title="Finding your location"
          body="This only takes a few seconds."
          footerHasLink
          footer={<AddressLink onPress={openAddress} />}
        />
      );
    case 'found':
      return (
        <IllustratedScreen
          illustration="found"
          title={!location || location.label === GPS_FALLBACK_LABEL ? 'We found your location' : `You’re near ${location.label}`}
          body="We’ll show pharmacies close to you first. You can change your location anytime from Home."
          footer={<Button label="Continue" fullWidth loading={saving} onPress={finish} />}
        >
          {location && <LocationCard location={location} onChange={openAddress} />}
        </IllustratedScreen>
      );
    case 'off':
      return (
        <IllustratedScreen
          illustration="off"
          title="Location is turned off"
          body="Turn it on so we can show pharmacies near you and how far they are. Or enter your address and we’ll use that instead."
          footerHasLink
          footer={
            <>
              <Button label="Turn on location" fullWidth onPress={() => turnOnLocation().then((p) => (p === 'on' ? locate() : undefined))} />
              <AddressLink onPress={openAddress} />
            </>
          }
        />
      );
    case 'address':
      return (
        <EnterAddress
          onBack={() => setStep(beforeAddress)}
          onUseCurrent={() => permissionState().then((p) => (p === 'can_ask' ? askForPermission() : p)).then(route)}
          onPick={(loc) => {
            setLocation(loc);
            setStep('address_set');
          }}
        />
      );
    case 'address_set':
      return (
        <IllustratedScreen
          illustration="found"
          title="You’re all set"
          body="We’ll show pharmacies near this address first. You can change it anytime from Home."
          footer={<Button label="Continue" fullWidth loading={saving} onPress={finish} />}
        >
          {location && <LocationCard location={location} onChange={openAddress} />}
        </IllustratedScreen>
      );
  }
}

function Checking() {
  const { colors } = useTheme();
  return (
    <View style={styles.checking}>
      <ActivityIndicator color={colors.brand.default} accessibilityLabel="Checking location" />
    </View>
  );
}

/** "Your address" (Figma 2678:160849): search, use my current location, suggestions. */
type SearchStatus = 'idle' | 'searching' | 'done' | PlacesErrorStatus;
type PlacesErrorStatus = 'not_set_up' | 'sign_in_required' | 'failed';

function EnterAddress({
  onBack,
  onUseCurrent,
  onPick,
}: {
  onBack: () => void;
  onUseCurrent: () => void;
  onPick: (loc: CustomerLocation) => void;
}) {
  const { colors, scheme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [picking, setPicking] = useState<string | null>(null);
  // One Google Places session per search, ended by the pick.
  const session = useRef(newPlacesSession());

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setStatus('idle');
      return;
    }
    let live = true;
    setStatus('searching');
    const t = setTimeout(() => {
      searchPlaces(q, session.current)
        .then((r) => live && (setResults(r), setStatus('done')))
        .catch((e) => live && (setResults([]), setStatus(e instanceof PlacesUnavailable ? e.reason : 'failed')));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  const pick = async (s: PlaceSuggestion) => {
    setPicking(s.placeId);
    try {
      const loc = await placeToLocation(s.placeId, session.current);
      session.current = newPlacesSession();
      onPick(loc);
    } catch (e) {
      setStatus(e instanceof PlacesUnavailable ? e.reason : 'failed');
    } finally {
      setPicking(null);
    }
  };

  const dark = scheme === 'dark';
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={space.sm}>
          <Icon name="chevron-left" size={sizes.icon.lg} color={dark ? colors.text.heading : colors.text.brand} />
        </Pressable>
        <Text style={[textStyle(webText.h4), { color: colors.text.heading }]} accessibilityRole="header">
          Your address
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.addressBody} keyboardShouldPersistTaps="handled">
        <SearchField placeholder="Search for your street or area" value={query} onChangeText={setQuery} />
        <Pressable
          onPress={onUseCurrent}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.useCurrent,
            {
              backgroundColor: pressed ? colors.surface.pressed : colors.brandSubtle,
              borderColor: dark ? colors.text.tertiary : 'transparent',
            },
          ]}
        >
          <View style={styles.useCurrentLabel}>
            <Icon name="location" size={sizes.icon.lg} color={colors.text.brand} />
            <Text variant="label1" color="brand">Use my current location</Text>
          </View>
          <Icon name="chevron-right" size={sizes.icon.lg} color={colors.icon.default} />
        </Pressable>
        <SuggestionsList query={query.trim()} results={results} status={status} picking={picking} onPick={pick} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SEARCH_MESSAGES: Record<PlacesErrorStatus, string> = {
  not_set_up: 'Address search isn’t set up yet. Use your current location instead.',
  sign_in_required: 'Sign in to search for an address.',
  failed: 'We couldn’t search right now. Check your connection and try again.',
};

function SuggestionsList({
  query,
  results,
  status,
  picking,
  onPick,
}: {
  query: string;
  results: PlaceSuggestion[];
  status: SearchStatus;
  picking: string | null;
  onPick: (s: PlaceSuggestion) => void;
}) {
  const { colors } = useTheme();
  if (query.length < 3) return null;
  let message: string | null = null;
  if (status === 'searching' && results.length === 0) message = 'Searching…';
  else if (status in SEARCH_MESSAGES) message = SEARCH_MESSAGES[status as PlacesErrorStatus];
  else if (status === 'done' && results.length === 0) message = `No places found for “${query}”. Try a street name or area.`;
  return (
    <View>
      <Text variant="label2" color="secondary" style={styles.suggestionsTitle}>Suggestions</Text>
      {message ? (
        <Text variant="caption1" color="secondary">{message}</Text>
      ) : (
        results.map((r, i) => (
          <View key={r.placeId}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.surface.pressed }]} />}
            <SuggestionRow
              label={r.label}
              addressLine={r.addressLine}
              busy={picking === r.placeId}
              onPress={() => picking === null && onPick(r)}
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  checking: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  benefits: { paddingHorizontal: space.md, marginTop: space.lg, gap: space.sm },
  // Figma: header 16px under the status bar; back chevron and title 16px apart.
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, marginTop: space.md },
  addressBody: { padding: space.md, paddingTop: space.lg, gap: space.md },
  useCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radii.xl,
    borderWidth: sizes.border.hairline,
  },
  useCurrentLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  // Figma: "Suggestions" sits 24px under the row, list 8px under the title.
  suggestionsTitle: { marginTop: space.xs, marginBottom: space.xs },
  divider: { height: sizes.border.hairline },
});

