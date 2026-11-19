import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space } from '@medfind/ui';
import { Button, Text } from '@medfind/ui/native';
import type { AuthEntry, CustomerLocation } from '@medfind/core';
import { LocationFlow, type LocationStep } from '../../features/location/LocationFlow';
import { hrefAfterAuth } from '../../lib/afterAuth';

const SAMPLE_GPS: CustomerLocation = {
  label: 'GRA Phase 2', addressLine: 'Port Harcourt · within 20 m', lat: 4.8156, lng: 7.0498, accuracyM: 20, source: 'gps',
};
const SAMPLE_ADDRESS: CustomerLocation = {
  label: '12 Ada George Road', addressLine: 'Mgbuoba, Port Harcourt, Rivers', lat: 4.8402, lng: 6.9937, accuracyM: null, source: 'address',
};

const PREVIEWS: { step: LocationStep; label: string; location?: CustomerLocation }[] = [
  { step: 'allow', label: 'Allow access' },
  { step: 'finding', label: 'Finding you' },
  { step: 'found', label: 'Found', location: SAMPLE_GPS },
  { step: 'off', label: 'Turned off' },
  { step: 'address', label: 'Enter address' },
  { step: 'address_set', label: 'Address set', location: SAMPLE_ADDRESS },
];

/**
 * Hidden /dev/location screen: runs the after-sign-up / after-log-in check (until the real
 * sign-up and log-in screens exist) and previews each Location access screen.
 */
export default function DevLocation() {
  const [preview, setPreview] = useState<(typeof PREVIEWS)[number] | null>(null);
  if (preview) {
    return (
      <LocationFlow
        key={preview.step}
        initialStep={preview.step}
        initialLocation={preview.location}
        onDone={() => setPreview(null)}
      />
    );
  }
  const run = async (entry: AuthEntry) => router.push(await hrefAfterAuth(entry));
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2">Location access</Text>
        <Text variant="body3" color="secondary">Run the check that follows sign-up verification or log in.</Text>
        <Button label="As a new customer (after sign-up)" variant="secondary" fullWidth onPress={() => run('sign_up')} />
        <Button label="As a returning customer (after log in)" variant="secondary" fullWidth onPress={() => run('log_in')} />
        <Text variant="h4">Preview a screen</Text>
        <View style={styles.grid}>
          {PREVIEWS.map((p) => (
            <Button key={p.step} label={p.label} variant="inline" size="small" onPress={() => setPreview(p)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: space.md, gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
