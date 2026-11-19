import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PICKUP_WINDOW_MINUTES, formatNaira } from '@medfind/core';
import { radii, space } from '@medfind/ui';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { findPharmacy, formatKm, openingLabel } from '../../features/demo/data';
import { deadlineOf, useReservation } from '../../features/demo/store';
import { InfoRows, Screen, kit } from '../../features/demo/kit';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Pay at pharmacy – reserved (Figma 2032:19172). Get directions opens the pickup code and map. */
export default function Reserved() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useReservation(id);
  if (!r) {
    router.replace('/reservations');
    return null;
  }
  const p = findPharmacy(r.pharmacyId);
  const deadline = deadlineOf(r) ?? new Date(r.placedAt.getTime() + PICKUP_WINDOW_MINUTES * 60_000);
  const confirmed = r.status === 'ready';
  return (
    <Screen
      title="Reservation"
      onBack={() => router.replace('/')}
      footer={
        <>
          <Button label="Get directions" iconLeft="location" fullWidth onPress={() => router.push(`/reservation/${r.id}`)} />
          <Button label="Cancel reservation" variant="destructive-inline" size="large" onPress={() => router.push({ pathname: `/reservation/${r.id}`, params: { cancel: '1' } })} />
        </>
      }
    >
      <Text variant="h2">Reserved. Pay when you collect</Text>
      <Text variant="body3" color="secondary">
        {confirmed
          ? `${p.name} is holding your ${r.medicineName.split(' ')[0]} until ${hhmm(deadline)}.`
          : `Waiting for ${p.name} to confirm. They reply within 10 minutes, then hold it for 2 hours.`}
      </Text>
      <View style={[styles.code, { backgroundColor: colors.brand.pressed }]}>
        <Text variant="caption1" style={{ color: colors.text.onBrand }}>
          Pickup code
        </Text>
        <Text variant="h1" style={{ color: colors.text.onBrand }} accessibilityLabel={`Pickup code ${r.pickupCode.split('').join(' ')}`}>
          {confirmed ? `${r.pickupCode.slice(0, 3)} ${r.pickupCode.slice(3)}` : '••• •••'}
        </Text>
        <Text variant="caption1" style={{ color: colors.text.onBrand }}>
          {confirmed ? 'Show this code at the counter' : 'Shows once the pharmacy confirms'}
        </Text>
      </View>
      <InfoRows
        rows={[
          { label: 'Pay at the counter', value: formatNaira(r.totals.totalKobo) },
          { label: 'Pharmacy', value: `${p.name}, ${p.area.split(' ')[0]}` },
          { label: 'Distance', value: `${formatKm(p.km)} · ${openingLabel(p)}` },
          { label: 'Held until', value: confirmed ? `${hhmm(deadline)} (2 hours)` : 'Starts when confirmed', tone: 'warning' },
        ]}
      />
      <View style={kit.row} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { alignItems: 'center', gap: space.xs, padding: space.lg, borderRadius: radii.xl },
});
