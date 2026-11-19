import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DELIVERY_FEE_KOBO, formatNaira, reservationTotals, type Fulfilment } from '@medfind/core';
import { radii, sizes, space } from '@medfind/ui';
import { Button, CalloutCard, Icon, OptionRow, Text, useTheme } from '@medfind/ui/native';
import { distanceKm, findInventory, findMedicine, findPharmacy, formatKm, medicineName } from '../features/demo/data';
import { MedThumb, Screen, kit } from '../features/demo/kit';
import { placeReservation } from '../features/demo/store';
import { defaultAddress, setAccount, useAccount } from '../features/demo/account';

/**
 * Reserve (Figma "Reserve – …", "Reserve OTC – …", "Delivery – choose how to pay", "Delivery OTC – …").
 * Prescription medicines go on to Upload prescription (3 steps); OTC go to Payment (2 steps),
 * or straight to "Pay at pharmacy – reserved".
 */
export default function Reserve() {
  const { colors } = useTheme();
  const { inventory: inventoryId, fulfilment: initialFulfilment } = useLocalSearchParams<{ inventory: string; fulfilment?: string }>();
  const inv = findInventory(inventoryId ?? 'fuasi:augmentin') ?? findInventory('fuasi:augmentin');
  const medicine = findMedicine(inv.medicineId);
  const pharmacy = findPharmacy(inv.pharmacyId);
  const account = useAccount();
  const existing = account.checkout?.inventoryId === inv.id ? account.checkout : null;
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [fulfilment, setFulfilment] = useState<Fulfilment>(
    existing?.fulfilment ?? (initialFulfilment === 'delivery' ? 'delivery' : 'pickup'),
  );
  const [payOnline, setPayOnline] = useState(existing?.payOnline ?? true);
  const totals = reservationTotals([{ unitPriceKobo: inv.priceKobo, quantity }], fulfilment);
  const address = account.addresses.find((a) => a.id === existing?.addressId) ?? defaultAddress(account);
  const rx = !!medicine.rx;
  const delivery = fulfilment === 'delivery';

  const saveCheckout = () =>
    setAccount({
      checkout: { inventoryId: inv.id, quantity, fulfilment, payOnline, addressId: address.id, prescriptionAttached: false },
      method: null,
    });

  const next = () => {
    saveCheckout();
    if (rx) return router.push('/prescription');
    if (payOnline) return router.push('/payment');
    const r = placeReservation(inv.id, quantity, fulfilment, { payment: 'pharmacy', addressLine: delivery ? address.line : undefined });
    router.replace(delivery ? `/reservation/${r.id}` : `/reserved/${r.id}`);
  };

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

  const cta = rx
    ? 'Continue to add prescription'
    : payOnline
      ? 'Continue to payment'
      : delivery
        ? `Reserve · pay on delivery`
        : 'Reserve · pay at pharmacy';

  return (
    <Screen
      title="Reserve"
      onBack={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/search', params: { q: medicine.short } }))}
      step={{ n: 1, of: rx ? 3 : 2 }}
      footer={<Button label={cta} fullWidth onPress={next} />}
    >
      <View style={[styles.card, { backgroundColor: colors.surface.raised }]}>
        <MedThumb medicineId={medicine.id} />
        <View style={styles.flex}>
          <Text variant="h5">{medicineName(medicine)}</Text>
          <Text variant="caption1" color="secondary">
            {pharmacy.name} · {formatKm(distanceKm(pharmacy))}
          </Text>
        </View>
        <Text variant="h5">{formatNaira(inv.priceKobo)}</Text>
      </View>

      <View style={kit.between}>
        <Text variant="body2" color="secondary">
          Amount
        </Text>
        <View style={[styles.stepper, { borderColor: colors.input.border }]}>
          <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} accessibilityLabel="Less" hitSlop={8}>
            <Icon name="minus" size={sizes.icon.md} color={colors.icon.default} />
          </Pressable>
          <Text variant="body2">{quantity}</Text>
          <Pressable onPress={() => setQuantity((q) => Math.min(inv.quantityInStock, q + 1))} accessibilityLabel="More" hitSlop={8}>
            <Icon name="add" size={sizes.icon.md} color={colors.icon.default} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.segments, { backgroundColor: colors.segment.track }]} accessibilityRole="tablist">
        {segment('pickup', 'Pick up')}
        {pharmacy.offersDelivery && segment('delivery', `Delivery · ${formatNaira(DELIVERY_FEE_KOBO)}`)}
      </View>

      {delivery && (
        <View style={[styles.address, { backgroundColor: colors.surface.raised }]}>
          <Icon name="home-2" size={sizes.icon.md} color={colors.text.brand} />
          <View style={styles.flex}>
            <Text variant="h5">Deliver to {address.label}</Text>
            <Text variant="caption1" color="secondary">
              {address.line}
            </Text>
            <Text variant="caption1" color="tertiary">
              Arrives in 45–60 min
            </Text>
          </View>
          <Button label="Change" variant="inline" size="small" onPress={() => (saveCheckout(), router.push('/delivery-address'))} />
        </View>
      )}

      <OptionRow
        title="Pay online now"
        description="Card, wallet, bank transfer or USSD. Only charged once the pharmacist confirms."
        icon="card"
        selected={payOnline}
        onPress={() => setPayOnline(true)}
      />
      <OptionRow
        title={delivery ? 'Pay on delivery' : 'Pay at pharmacy'}
        description={delivery ? 'Cash or transfer to the rider when it arrives.' : 'Cash, card or transfer when you collect.'}
        icon="store"
        selected={!payOnline}
        onPress={() => setPayOnline(false)}
      />

      {rx && (
        <CalloutCard
          icon="document"
          title="Prescription required"
          body="This is a prescription-only drug. Attach a clear photo of your prescription in the next page to continue."
        />
      )}

      <View style={styles.summary}>
        <Text variant="h5">Order summary</Text>
        <View style={kit.between}>
          <Text variant="body3" color="secondary">
            {medicine.short} × {quantity}
          </Text>
          <Text variant="body3">{formatNaira(totals.subtotalKobo)}</Text>
        </View>
        {delivery && (
          <View style={kit.between}>
            <Text variant="body3" color="secondary">
              Delivery
            </Text>
            <Text variant="body3">{formatNaira(totals.deliveryFeeKobo)}</Text>
          </View>
        )}
        <View style={[kit.between, styles.total, { borderTopColor: colors.surface.border }]}>
          <Text variant="h5">Total</Text>
          <Text variant="h5">{formatNaira(totals.totalKobo)}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  address: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radii.xl },
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
});
