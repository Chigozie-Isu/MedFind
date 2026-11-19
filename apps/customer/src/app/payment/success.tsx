import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { formatNaira } from '@medfind/core';
import { Button, Text } from '@medfind/ui/native';
import { useReservation } from '../../features/demo/store';
import { InfoRows, ResultBadge, Screen, kit } from '../../features/demo/kit';
import { transferAccount } from '../../features/demo/data';

const stamp = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Payment successful / Card – payment successful / Bank transfer – received (Figma 2239:43224, 2031:19129, 2030:18784). */
export default function PaymentSuccess() {
  const { id, via } = useLocalSearchParams<{ id: string; via?: string }>();
  const r = useReservation(id);
  if (!r) {
    return <Redirect href="/reservations" />;
  }
  const paidWith =
    via === 'transfer' ? `Bank transfer · ${transferAccount.bank}` : via === 'wallet' ? 'MedFind wallet' : `Card •••• ${r.cardLast4 ?? '1456'}`;
  const held = via !== 'wallet';
  return (
    <Screen
      onBack={false}
      footer={
        <>
          <Button label={r.fulfilment === 'delivery' ? 'Track delivery' : 'View pickup code'} fullWidth onPress={() => router.replace(`/reservation/${r.id}`)} />
          <Button label="Back to home" variant="text" size="large" onPress={() => router.replace('/')} />
        </>
      }
    >
      <ResultBadge tone="success" />
      <Text variant="h2" style={kit.center}>
        {via === 'transfer' ? 'Payment received' : 'Payment successful'}
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        We’ve sent your reservation to {r.pharmacyName}. They confirm within 10 minutes, then your {r.fulfilment === 'delivery' ? 'rider sets off' : 'pickup code shows'}.
        {held ? ' You’re only charged if they confirm.' : ''}
      </Text>
      <InfoRows
        rows={[
          { label: held ? 'Amount held' : 'Amount paid', value: formatNaira(r.totals.totalKobo) },
          { label: 'Paid with', value: paidWith },
          { label: 'Reference', value: r.paymentRef },
          { label: 'Date', value: stamp(r.placedAt) },
        ]}
      />
    </Screen>
  );
}
