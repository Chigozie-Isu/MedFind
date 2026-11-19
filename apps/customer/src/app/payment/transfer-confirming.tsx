import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { formatNaira } from '@medfind/core';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { transferAccount } from '../../features/demo/data';
import { checkoutTotals, placeFromCheckout } from '../../features/demo/checkout';
import { InfoRows, Screen, kit } from '../../features/demo/kit';

/** Bank transfer – confirming (Figma 2030:18729), then received after a few seconds. */
export default function TransferConfirming() {
  const { colors } = useTheme();
  const t = useRef(checkoutTotals()).current;
  // The transfer "lands" straight away, so leaving early still keeps the reservation.
  const placed = useRef(t ? placeFromCheckout('transfer') : null).current;
  useEffect(() => {
    if (!placed) return;
    const i = setTimeout(() => router.replace({ pathname: '/payment/success', params: { id: placed.id, via: 'transfer' } }), 3000);
    return () => clearTimeout(i);
  }, [placed]);
  if (!t) {
    router.replace('/');
    return null;
  }
  return (
    <Screen title="Bank transfer" onBack={false} footer={<Button label="Back to home" variant="text" size="large" onPress={() => router.replace('/')} />}>
      <ActivityIndicator size="large" color={colors.brand.default} accessibilityLabel="Checking" />
      <Text variant="h2" style={kit.center}>
        Checking for your transfer
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        This usually takes less than a minute. You can leave this screen and we’ll let you know when it lands.
      </Text>
      <InfoRows
        rows={[
          { label: 'Amount', value: formatNaira(t.totals.totalKobo) },
          { label: 'To', value: `${transferAccount.bank} · ${transferAccount.number}` },
        ]}
      />
    </Screen>
  );
}
