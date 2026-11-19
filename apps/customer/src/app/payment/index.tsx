import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, space } from '@medfind/ui';
import { Button, OptionRow, Text, useTheme } from '@medfind/ui/native';
import type { DemoPaymentMethod } from '@medfind/core';
import { cardLabel, defaultCard, setAccount, useAccount } from '../../features/demo/account';
import { checkoutTotals, placeFromCheckout } from '../../features/demo/checkout';
import { Note, Screen } from '../../features/demo/kit';

/**
 * Payment – choose method (Figma 2238:41399 / 2239:41853, wallet / card / bank transfer selected,
 * and "Payment – OTC delivery"). Card goes on to "Verify with your bank"; bank transfer to the
 * one-time account; wallet pays straight away.
 */
export default function Payment() {
  const { colors } = useTheme();
  const account = useAccount();
  const t = checkoutTotals();
  if (!t) {
    return <Redirect href="/" />;
  }
  const { med, totals, c } = t;
  const method = account.method ?? (account.walletFirst ? 'wallet' : null);
  const card = defaultCard(account);
  const short = account.walletKobo < totals.totalKobo;
  const pick = (m: DemoPaymentMethod) => setAccount({ method: m });

  const pay = () => {
    if (method === 'wallet') {
      const r = placeFromCheckout('wallet');
      if (r) router.replace({ pathname: '/payment/success', params: { id: r.id, via: 'wallet' } });
    } else if (method === 'card') router.push('/payment/verify');
    else if (method === 'transfer') router.push('/payment/transfer');
  };

  return (
    <Screen
      title="Payment"
      step={{ n: c.prescriptionAttached || med.rx ? 3 : 2, of: med.rx ? 3 : 2 }}
      footer={
        <Button
          label={`Pay ${formatNaira(totals.totalKobo)}`}
          fullWidth
          disabled={!method || (method === 'wallet' && short)}
          onPress={pay}
        />
      }
    >
      <View style={[styles.total, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <Text variant="caption1" color="secondary">
          Total to pay
        </Text>
        <Text variant="h1">{formatNaira(totals.totalKobo)}</Text>
        <Text variant="caption1" color="secondary">
          {med.name} × {c.quantity}
          {c.fulfilment === 'delivery' ? ` · includes ${formatNaira(totals.deliveryFeeKobo)} delivery` : ''}
        </Text>
      </View>
      <Text variant="h5">Pay with</Text>
      <OptionRow
        title="MedFind wallet"
        description={`${formatNaira(account.walletKobo)} available`}
        icon="wallet"
        selected={method === 'wallet'}
        onPress={() => pick('wallet')}
        actionLabel="Top up"
        onAction={() => router.push('/wallet/top-up')}
      />
      {method === 'wallet' && short && (
        <Note icon="danger-triangle" tone="warning">
          Your wallet is short by {formatNaira(totals.totalKobo - account.walletKobo)}. Top up or pick another way to pay.
        </Note>
      )}
      <OptionRow
        title={`Card •••• ${card.last4}`}
        description={`Expires ${card.expiry}`}
        icon="card"
        selected={method === 'card'}
        onPress={() => pick('card')}
        actionLabel="Change"
        onAction={() => router.push('/payment/card')}
      />
      <OptionRow
        title="Bank transfer"
        description="To a one-time account number"
        icon="store"
        selected={method === 'transfer'}
        onPress={() => pick('transfer')}
      />
      <Note icon="shield">Only charged once the pharmacist confirms. Paying with {cardLabel(card)} or a transfer is a hold until then.</Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { padding: space.md, borderRadius: radii.xl, gap: space.xs },
});
