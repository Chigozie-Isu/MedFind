import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APPROVAL_WINDOW_MINUTES, PICKUP_WINDOW_MINUTES, formatNaira } from '@medfind/core';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Card, Icon, Text, useTheme } from '@medfind/ui/native';
import { findPharmacy } from '../../features/demo/data';
import { StatusBadge } from '../../features/demo/parts';
import { cancelReservation, deadlineOf, markCollected, useReservation } from '../../features/demo/store';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * Pickup code – waiting for pharmacy (Figma 289:9235), then ready, pay at pharmacy (Figma 2436:86375).
 * Changes the moment the pharmacy approves or declines (Supabase Realtime, see features/demo/store).
 */
export default function PickupCode() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useReservation(id);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!r) return <SafeAreaView style={styles.flex}><Button label="Back to reservations" onPress={() => router.replace('/reservations')} /></SafeAreaView>;
  const pharmacy = findPharmacy(r.pharmacyId);
  const ready = r.status === 'ready';
  const ended = r.status === 'declined' || r.status === 'expired';
  const deadline = deadlineOf(r);
  const left = deadline ? deadline.getTime() - now : 0;
  const total = formatNaira(r.totals.totalKobo);
  const pickup = r.fulfilment === 'pickup';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.surface.muted }]} edges={['top', 'bottom']}>
      <View style={styles.map}>
        <View style={styles.close}>
          <Button icon="close" variant="secondary" size="small" onPress={() => router.navigate('/')} accessibilityLabel="Close" />
        </View>
        <View style={styles.pin}>
          <View style={[styles.pinLabel, { backgroundColor: colors.surface.raised }]}>
            <Text variant="caption1">{pharmacy.name}</Text>
          </View>
          <Icon name="location" size={sizes.icon.xl} color={colors.brand.default} />
        </View>
      </View>
      <ScrollView style={[styles.sheet, { backgroundColor: colors.surface.default }]} contentContainerStyle={styles.sheetContent}>
        <View style={styles.between}>
          <StatusBadge status={r.status} />
          {ready && deadline && (
            <Text variant="caption1" color="secondary">
              Held until {hhmm(deadline)}
            </Text>
          )}
        </View>
        <Text variant="h2">
          {r.medicineName} × {r.quantity}
        </Text>
        <Text variant="body3" color="secondary">
          {pharmacy.name} · {pharmacy.street}, {pharmacy.area}
        </Text>

        {ended ? (
          <Card>
            <Text variant="h5">
              {r.status === 'declined' ? `${pharmacy.name} declined your reservation` : `${pharmacy.name} didn’t reply in ${APPROVAL_WINDOW_MINUTES} mins`}
            </Text>
            <Text variant="body3" color="secondary">
              {r.status === 'declined' ? `“${r.declineReason}”` : 'Your reservation has expired.'} You haven’t been charged, so you can reserve at
              another pharmacy.
            </Text>
          </Card>
        ) : r.status === 'cancelled' || r.status === 'collected' ? null : ready ? (
          <>
            <Card>
              <Text variant="caption1" color="secondary">
                {pickup ? 'Show this code at the counter' : 'Give this code to your rider'}
              </Text>
              <Text variant="h1" accessibilityLabel={`Pickup code ${r.pickupCode.split('').join(' ')}`}>
                {r.pickupCode.slice(0, 3)} {r.pickupCode.slice(3)}
              </Text>
            </Card>
            {pickup && (
              <View style={styles.timer}>
                <Text variant="h2" color="secondary">
                  {countdown(left)} <Text variant="body3" color="secondary">left</Text>
                </Text>
                <View style={[styles.track, { backgroundColor: colors.surface.border }]}>
                  <View
                    style={[
                      styles.fill,
                      { backgroundColor: colors.brand.default, width: `${(left / (PICKUP_WINDOW_MINUTES * 60_000)) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <Card>
              <View style={styles.row}>
                <ActivityIndicator color={colors.brand.default} />
                <View style={styles.flex}>
                  <Text variant="h5">Waiting for the pharmacy</Text>
                  <Text variant="caption1" color="secondary">
                    {pharmacy.name} replies within {APPROVAL_WINDOW_MINUTES} mins
                  </Text>
                </View>
              </View>
            </Card>
            <Card>
              <Text variant="caption1" color="secondary">
                {pickup ? 'Pickup code' : 'Delivery code'} · shows once confirmed
              </Text>
              <View style={[styles.placeholder, { backgroundColor: colors.surface.muted }]} />
            </Card>
          </>
        )}

        {!ended && r.status !== 'cancelled' && r.status !== 'collected' && (
        <View style={styles.note}>
          <Icon name="shield" size={sizes.icon.md} color={colors.text.secondary} />
          <Text variant="caption1" color="secondary" style={styles.flex}>
            {pickup
              ? `Pay ${total} at the pharmacy when you collect. Pick up within ${PICKUP_WINDOW_MINUTES / 60} hours of it being ready.`
              : `Pay ${total} when your order arrives. This includes ${formatNaira(r.totals.deliveryFeeKobo)} delivery.`}
          </Text>
        </View>
        )}
        {r.status === 'cancelled' && <Card><Text variant="h5">Reservation cancelled</Text><Text variant="body3">No payment was taken.</Text></Card>}
        {r.status === 'collected' && <Card><Text variant="h5">Order completed</Text><Text variant="body3">Collection and payment were simulated for this demo.</Text></Card>}
        {(r.status === 'waiting' || r.status === 'ready') && <Button label="Cancel reservation" variant="secondary" fullWidth onPress={() => cancelReservation(r.id)} />}
        {ready && <Button label={pickup ? 'Simulate collection and payment' : 'Simulate delivery and payment'} fullWidth onPress={() => markCollected(r.id)} />}
        {ended && (
          <Button
            label="Find another pharmacy"
            fullWidth
            onPress={() => router.navigate({ pathname: '/search', params: { q: r.medicineName.split(' ')[0] } })}
          />
        )}
        <Button label="My reservations" variant={ready ? 'primary' : 'secondary'} fullWidth onPress={() => router.navigate('/reservations')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { height: 220 },
  close: { position: 'absolute', top: space.md, left: space.md, zIndex: 1 },
  pin: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  pinLabel: { paddingHorizontal: space.sm, paddingVertical: space.xxs, borderRadius: radii.lg },
  sheet: { flex: 1, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  sheetContent: { padding: space.md, gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  placeholder: { height: 28, width: 160, borderRadius: radii.sm, marginTop: space.xs },
  timer: { gap: space.sm },
  track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: 6 },
  note: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
});
