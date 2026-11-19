import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { formatNaira } from '@medfind/core';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { getAccount, walletMove } from '../../features/demo/account';
import { InfoRows, ResultBadge, Screen, kit } from '../../features/demo/kit';

/**
 * Top up – adding money (2033:19369) then money added (2033:19420); Withdraw – money sent (2440:87162).
 * "Pay for a reservation" goes back to Payment when a checkout is waiting, else to Search.
 */
export default function WalletDone() {
  const { colors } = useTheme();
  const { mode, kobo, from } = useLocalSearchParams<{ mode?: string; kobo?: string; from?: string }>();
  const withdraw = mode === 'withdraw';
  const amount = parseInt(kobo ?? '0', 10);
  const [busy, setBusy] = useState(!withdraw);
  useEffect(() => {
    const t = setTimeout(
      () => {
        walletMove(withdraw ? 'Withdrawal' : 'Added money', withdraw ? -amount : amount, withdraw ? 'payment' : 'topup');
        setBusy(false);
      },
      withdraw ? 0 : 1500,
    );
    return () => clearTimeout(t);
  }, [amount, withdraw]);
  const balance = getAccount().walletKobo;

  if (busy)
    return (
      <Screen title="Add money" onBack={false}>
        <ActivityIndicator size="large" color={colors.brand.default} accessibilityLabel="Adding money" />
        <Text variant="h2" style={kit.center}>
          Adding {formatNaira(amount)} to your wallet
        </Text>
        <Text variant="body3" color="secondary" style={kit.center}>
          This only takes a few seconds. Please keep this screen open.
        </Text>
        <InfoRows rows={[{ label: 'Amount', value: formatNaira(amount) }, { label: 'From', value: from ?? 'Card' }, { label: 'Fee', value: '₦0' }]} />
      </Screen>
    );

  return (
    <Screen
      onBack={false}
      footer={
        <>
          <Button label="Back to wallet" fullWidth onPress={() => router.replace('/wallet')} />
          <Button
            label="Pay for a reservation"
            variant="text"
            size="large"
            onPress={() => (getAccount().checkout ? router.replace('/payment') : router.replace('/search'))}
          />
        </>
      }
    >
      <ResultBadge tone="success" />
      <Text variant="h2" style={kit.center}>
        {withdraw ? `${formatNaira(amount)} on its way` : `${formatNaira(amount)} added`}
      </Text>
      <Text variant="body3" color="secondary" style={kit.center}>
        {withdraw
          ? 'We’re sending it to your bank. It usually arrives within minutes.'
          : 'Your wallet is topped up and ready to pay for reservations.'}
      </Text>
      <InfoRows
        rows={[
          { label: 'Amount', value: formatNaira(amount) },
          { label: withdraw ? 'To' : 'From', value: from ?? '' },
          { label: 'Fee', value: '₦0' },
          { label: 'New balance', value: formatNaira(balance) },
        ]}
      />
    </Screen>
  );
}
