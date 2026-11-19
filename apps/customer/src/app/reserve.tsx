import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DELIVERY_FEE_KOBO, formatNaira, reservationTotals, type Fulfilment } from '@medfind/core';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Icon, OptionRow, Text, useTheme } from '@medfind/ui/native';
import { distanceKm, findInventory, findMedicine, findPharmacy, formatKm, medicineName } from '../features/demo/data';
import { Thumb } from '../features/demo/parts';
import { placeReservation } from '../features/demo/store';

/** Reserve OTC – pay at pharmacy selected (Figma 2496:126243). */
export default function Reserve() {
  const { colors } = useTheme();
  const { inventory: inventoryId } = useLocalSearchParams<{ inventory: string }>();
  const inv = findInventory(inventoryId);
  const medicine = findMedicine(inv.medicineId);
  const pharmacy = findPharmacy(inv.pharmacyId);
  const [quantity, setQuantity] = useState(1);
  const [fulfilment, setFulfilment] = useState<Fulfilment>('pickup');
  const totals = reservationTotals([{ unitPriceKobo: inv.priceKobo, quantity }], fulfilment);
  const name = medicineName(medicine);

  const segment = (value: Fulfilment, label: string) => {
    const on = fulfilment === value;
    return (
      <Pressable
        onPress={() => setFulfilment(value)}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        style={[styles.segment, on && { backgroundColor: colors.segment.activeBg }]}
      >
        <Text variant="body2" style={{ color: on ? colors.segment.activeText : colors.segment.inactiveText }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Button icon="chevron-left" variant="text" size="large" onPress={() => router.back()} accessibilityLabel="Back" />
        <Text variant="h2">Reserve</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface.raised }]}>
          <Thumb />
          <View style={styles.flex}>
            <Text variant="h5">{name}</Text>
            <Text variant="caption1" color="secondary">
              {pharmacy.name} · {formatKm(distanceKm(pharmacy))}
            </Text>
          </View>
          <Text variant="h5">{formatNaira(inv.priceKobo)}</Text>
        </View>

        <View style={styles.between}>
          <Text variant="body2" color="secondary">
            Amount
          </Text>
          <View style={[styles.stepper, { borderColor: colors.input.border }]}>
            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} accessibilityLabel="Less" hitSlop={8}>
              <Icon name="minus" size={sizes.icon.md} color={colors.icon.default} />
            </Pressable>
            <Text variant="body2">{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(inv.quantityInStock, q + 1))}
              accessibilityLabel="More"
              hitSlop={8}
            >
              <Icon name="add" size={sizes.icon.md} color={colors.icon.default} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.segments, { backgroundColor: colors.segment.track }]} accessibilityRole="tablist">
          {segment('pickup', 'Pick up')}
          {pharmacy.offersDelivery && segment('delivery', `Delivery · ${formatNaira(DELIVERY_FEE_KOBO)}`)}
        </View>

        <OptionRow
          title="Pay at pharmacy"
          description={fulfilment === 'pickup' ? 'Cash, card or transfer when you collect.' : 'Cash, card or transfer when it arrives.'}
          icon="store"
          selected
        />

        <View style={styles.summary}>
          <Text variant="h5">Order summary</Text>
          <View style={styles.between}>
            <Text variant="body3" color="secondary">
              {medicine.short} × {quantity}
            </Text>
            <Text variant="body3">{formatNaira(totals.subtotalKobo)}</Text>
          </View>
          {fulfilment === 'delivery' && (
            <View style={styles.between}>
              <Text variant="body3" color="secondary">
                Delivery
              </Text>
              <Text variant="body3">{formatNaira(totals.deliveryFeeKobo)}</Text>
            </View>
          )}
          <View style={[styles.between, styles.total, { borderTopColor: colors.surface.border }]}>
            <Text variant="h5">Total</Text>
            <Text variant="h5">{formatNaira(totals.totalKobo)}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={`Reserve · ${formatNaira(totals.totalKobo)}`}
          fullWidth
          onPress={() => {
            const r = placeReservation(inv.id, quantity, fulfilment);
            router.replace(`/reservation/${r.id}`);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  content: { padding: space.md, gap: space.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  segments: { flexDirection: 'row', borderRadius: radii.xl },
  segment: { flex: 1, alignItems: 'center', paddingVertical: space.sm, borderRadius: radii.xl },
  summary: { gap: space.sm },
  total: { borderTopWidth: 1, paddingTop: space.sm },
  footer: { padding: space.md },
});
