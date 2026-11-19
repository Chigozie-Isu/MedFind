import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, space } from '@medfind/ui';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { findMedicine, findPharmacy } from '../../features/demo/data';
import { rateReservation, useReservation } from '../../features/demo/store';
import { InfoRows, ResultBadge, Screen, Stars, kit, useFlash } from '../../features/demo/kit';
import { saveMedicine, useAccount } from '../../features/demo/account';

const stamp = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Rate (Figma "Rate – paid at pharmacy / paid online / delivered", each with "rated" and
 * "medicine saved" versions): All done, receipt, stars, Save for next time, Done.
 */
export default function Rate() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useReservation(id);
  const account = useAccount();
  const [flash, showFlash] = useFlash();
  if (!r) return <Redirect href="/reservations" />;
  if (r.status !== 'collected') return <Redirect href={`/reservation/${r.id}`} />;
  const pharmacy = findPharmacy(r.pharmacyId);
  const med = findMedicine(r.medicineId);
  const short = med.short.split(' ')[0];
  const saved = account.saved.some((s) => s.medicineId === r.medicineId);
  const delivered = r.fulfilment === 'delivery';
  const total = formatNaira(r.totals.totalKobo);
  const paid =
    r.payment === 'pharmacy' ? (delivered ? 'Paid the rider' : 'Paid at counter') : r.payment === 'wallet' ? 'Paid from wallet' : r.payment === 'transfer' ? 'Paid by transfer' : `Paid with card •••• ${r.cardLast4 ?? '1456'}`;
  const body = delivered
    ? `Your ${short} was delivered to ${r.addressLine?.split(',')[0] ?? 'your address'}.`
    : r.payment === 'pharmacy'
      ? `You paid ${total} at ${pharmacy.name} and collected your ${short}.`
      : `You collected your ${short} from ${pharmacy.name}.`;

  return (
    <Screen
      onBack={false}
      overlay={flash}
      footer={
        <>
          <Button
            label={saved ? 'Saved · View my medicines' : `Save ${short} for next time`}
            iconLeft="bookmark"
            variant="secondary"
            fullWidth
            onPress={() => {
              if (saved) return router.push('/saved');
              saveMedicine(r.medicineId, `${r.pharmacyId}:${r.medicineId}`);
              showFlash(`${short} saved for quick refills`);
            }}
          />
          <Button label="Done" fullWidth onPress={() => router.replace('/')} />
        </>
      }
    >
      <ResultBadge tone="success" />
      <Text variant="h1" style={kit.center}>
        All done
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        {body}
      </Text>
      <InfoRows
        rows={[
          { label: paid, value: total },
          { label: 'Pharmacy', value: `${pharmacy.name}, ${pharmacy.area.split(' ')[0]}` },
          { label: delivered ? 'Delivered' : 'Collected', value: stamp(r.collectedAt ?? new Date()) },
        ]}
      />
      <View style={[styles.rate, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <Text variant="h5" style={kit.center}>
          {r.rating ? `Thanks for rating ${pharmacy.name}` : `How was ${pharmacy.name}?`}
        </Text>
        <Stars value={r.rating ?? 0} onChange={(n) => rateReservation(r.id, n)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rate: { padding: space.md, borderRadius: radii.xl, gap: space.md },
});
