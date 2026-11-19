import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, space } from '@medfind/ui';
import { Badge, Button, Text, useTheme } from '@medfind/ui/native';
import { findMedicine, findPharmacy, formatKm, inventory, openingLabel, pharmacist } from '../../features/demo/data';
import { useReservation, type DemoReservation } from '../../features/demo/store';
import { MedThumb, Note, Screen, kit, mascots } from '../../features/demo/kit';
import { walletMove } from '../../features/demo/account';

const refunded = new Set<string>();

function moneyLine(r: DemoReservation): string {
  const total = formatNaira(r.totals.totalKobo);
  if (r.payment === 'pharmacy') return 'You weren’t charged, because you were paying at the pharmacy.';
  if (r.payment === 'wallet') return `${total} is back in your MedFind wallet.`;
  return `You weren’t charged. The ${total} hold is released to your bank.`;
}

/** Reservation cancelled (534:25670), declined (535:4801) and expired (534:24204). */
export default function Ended() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useReservation(id);

  // Wallet payments are refunded to the wallet when the pharmacy declines or the hold runs out.
  useEffect(() => {
    if (r && r.payment === 'wallet' && (r.status === 'declined' || r.status === 'expired') && !refunded.has(r.id)) {
      refunded.add(r.id);
      walletMove(`Refund · ${r.medicineName}`, r.totals.totalKobo, 'refund');
    }
  }, [r]);

  if (!r) return <Redirect href="/reservations" />;
  if (r.status === 'waiting' || r.status === 'ready') return <Redirect href={`/reservation/${r.id}`} />;
  if (r.status === 'collected') return <Redirect href={`/rate/${r.id}`} />;

  const pharmacy = findPharmacy(r.pharmacyId);
  const first = pharmacy.name.split(' ')[0];
  const kind = r.status as 'cancelled' | 'declined' | 'expired';
  const findAnother = () => router.replace({ pathname: '/search', params: { q: findMedicine(r.medicineId).short } });
  const alt = inventory
    .filter((i) => i.medicineId === r.medicineId && i.pharmacyId !== r.pharmacyId)
    .sort((a, b) => findPharmacy(a.pharmacyId).km - findPharmacy(b.pharmacyId).km)[0];
  const altPharmacy = alt ? findPharmacy(alt.pharmacyId) : null;

  const title = kind === 'cancelled' ? 'Reservation cancelled' : kind === 'declined' ? `${first} declined Reservation` : 'Your hold has ended';
  const body =
    kind === 'cancelled'
      ? `We’ve told ${pharmacy.name}. Thanks for letting them know.`
      : kind === 'declined'
        ? 'The pharmacist has declined your reservation request, see their reason below.'
        : 'Your reservation time has elapsed, so the medicine went back on the shelf.';

  return (
    <Screen
      onBack={() => router.replace('/')}
      right={<Button label="My Reservations" variant="inline" size="small" onPress={() => router.replace('/reservations')} />}
      footer={
        <>
          {kind === 'expired' && altPharmacy ? (
            <>
              <Button label={`Reserve at ${altPharmacy.name.split(' ')[0]}`} fullWidth onPress={() => router.replace({ pathname: '/reserve', params: { inventory: alt.id } })} />
              <Button label="See all pharmacies available" variant="text" size="large" onPress={findAnother} />
            </>
          ) : (
            <>
              <Button label="Find another pharmacy" fullWidth onPress={findAnother} />
              <Button label="Back to home" variant="text" size="large" onPress={() => router.replace('/')} />
            </>
          )}
        </>
      }
    >
      <Image source={mascots[kind]} style={styles.mascot} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body3" color="secondary">
        {body}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <MedThumb medicineId={r.medicineId} />
        <View style={styles.flex}>
          <Text variant="h5">{r.medicineName}</Text>
          <Text variant="caption1" color="secondary">
            Reservation · {r.ref}
          </Text>
        </View>
        <Badge label={kind[0].toUpperCase() + kind.slice(1)} tone={kind === 'cancelled' ? 'neutral' : 'error'} />
      </View>

      {kind === 'declined' && (
        <View style={[styles.message, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
          <View style={kit.row}>
            <View style={[styles.avatar, { backgroundColor: colors.brandSubtle }]}>
              <Text variant="label1" color="brand">
                {pharmacist.initials}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="h5">{pharmacist.name}</Text>
              <Text variant="caption1" color="secondary">
                {pharmacist.role}
              </Text>
            </View>
          </View>
          <Text variant="body3">{r.declineReason ?? 'Sorry, we can’t fill this reservation right now.'}</Text>
        </View>
      )}

      {kind === 'cancelled' && (
        <View style={[styles.message, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
          <View style={kit.between}>
            <Text variant="h5">Your money</Text>
            <Badge label={r.payment === 'pharmacy' ? 'Nothing to pay' : 'Released'} tone="success" dot="left" />
          </View>
          {r.payment !== 'pharmacy' && (
            <>
              <View style={kit.between}>
                <Text variant="label2" color="secondary">
                  {r.payment === 'wallet' ? 'Back in your wallet' : 'Card hold released'}
                </Text>
                <Text variant="label1">{formatNaira(r.totals.totalKobo)}</Text>
              </View>
              <View style={kit.between}>
                <Text variant="label2" color="secondary">
                  Charged
                </Text>
                <Text variant="label1">₦0{r.cardLast4 ? ` · card •••• ${r.cardLast4}` : ''}</Text>
              </View>
            </>
          )}
          {r.cancelReason && (
            <Text variant="caption1" color="secondary">
              Reason: {r.cancelReason}
            </Text>
          )}
          <Note icon="info-circle">
            {r.payment === 'card' || r.payment === 'transfer'
              ? 'Most banks show this within minutes. Some take up to 3 working days.'
              : moneyLine(r)}
          </Note>
        </View>
      )}

      {kind !== 'cancelled' && (
        <Note icon="info-circle" tone={kind === 'declined' ? 'success' : undefined}>
          {moneyLine(r)}
        </Note>
      )}

      {kind === 'expired' && altPharmacy && alt && (
        <View style={kit.gapSm}>
          <Text variant="h5">Open now and in stock</Text>
          <View style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
            <View style={styles.flex}>
              <Text variant="h4">{altPharmacy.name}</Text>
              <Text variant="caption1" color="secondary">
                {formatKm(altPharmacy.km)} · {openingLabel(altPharmacy)}
              </Text>
              <View style={kit.row}>
                <Badge label="In stock" tone="success" />
              </View>
            </View>
            <Text variant="h4">{formatNaira(alt.priceKobo)}</Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
  mascot: { width: 150, height: 112 },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  message: { padding: space.md, borderRadius: radii.xl, gap: space.sm },
  avatar: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
