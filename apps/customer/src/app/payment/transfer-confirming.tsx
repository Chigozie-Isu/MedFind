import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { formatNaira } from '@medfind/core';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { transferAccount } from '../../features/demo/data';
import { placeFromCheckout } from '../../features/demo/checkout';
import { InfoRows, Screen, kit } from '../../features/demo/kit';

/** Bank transfer – confirming (Figma 2030:18729), then received after a few seconds. */
export default function TransferConfirming() {
  const { colors } = useTheme();
  // The transfer "lands" straight away, so leaving early still keeps the reservation.
  // Placed in an effect, not during render, because placing updates the shared store.
  const [placed, setPlaced] = useState<ReturnType<typeof placeFromCheckout> | undefined>(undefined);
  useEffect(() => setPlaced(placeFromCheckout('transfer')), []);
  useEffect(() => {
    if (!placed) return;
    const i = setTimeout(() => router.replace({ pathname: '/payment/success', params: { id: placed.id, via: 'transfer' } }), 3000);
    return () => clearTimeout(i);
  }, [placed]);
  if (placed === undefined) return null;
  if (!placed) {
    return <Redirect href="/" />;
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
          { label: 'Amount', value: formatNaira(placed.totals.totalKobo) },
          { label: 'To', value: `${transferAccount.bank} · ${transferAccount.number}` },
        ]}
      />
    </Screen>
  );
}
