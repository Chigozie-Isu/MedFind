import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, space } from '@medfind/ui';
import { Badge, Button, Text, useTheme } from '@medfind/ui/native';
import { Thumb } from './parts';
import { deadlineOf, type DemoReservation } from './store';

export function minsLeft(r: DemoReservation, now = Date.now()): string {
  const d = deadlineOf(r);
  if (!d) return 'Waiting for pharmacy';
  const s = Math.max(0, Math.floor((d.getTime() - now) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')} left`;
}

/** "Active now" card (Figma "Home – active reservation" / "My reservations – active"). */
export function ActiveCard({ r }: { r: DemoReservation }) {
  const { colors } = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ready = r.status === 'ready';
  return (
    <Pressable
      onPress={() => router.push(`/reservation/${r.id}`)}
      accessibilityRole="button"
      style={[styles.active, { backgroundColor: colors.surface.raised }]}
    >
      <View style={styles.activeTop}>
        <Thumb medicineId={r.medicineId} />
        <View style={styles.flex}>
          <View style={styles.row}>
            <Text variant="h5" style={styles.flex} numberOfLines={1}>
              {r.medicineName}
            </Text>
            <Badge label={ready ? (r.fulfilment === 'delivery' ? 'On the way' : 'Ready') : 'Waiting'} tone={ready ? 'success' : 'info'} dot="left" />
          </View>
          <Text variant="caption1" color="secondary">
            {r.pharmacyName} · Code {r.pickupCode}
          </Text>
          <View style={styles.row}>
            <Text variant="caption1" color="tertiary" style={styles.flex}>
              {minsLeft(r, now)}
            </Text>
            <Button label="View code" size="small" onPress={() => router.push(`/reservation/${r.id}`)} />
          </View>
        </View>
      </View>
      {r.payment === 'pharmacy' && ready && (
        <View style={[styles.payStrip, { backgroundColor: colors.tone.warning.bg }]}>
          <Text variant="caption1" style={{ color: colors.tone.warning.text }}>
            Pay at pickup
          </Text>
          <Text variant="label2" style={{ color: colors.tone.warning.text }}>
            Pay {formatNaira(r.totals.totalKobo)} here
          </Text>
        </View>
      )}
    </Pressable>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  active: { borderRadius: radii.xl, overflow: 'hidden' },
  activeTop: { flexDirection: 'row', gap: space.md, padding: space.md, alignItems: 'center' },
  payStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: space.xs },
});
