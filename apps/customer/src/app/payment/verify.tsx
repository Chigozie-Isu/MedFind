import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { Button, CodeInput, Text } from '@medfind/ui/native';
import { defaultCard, useAccount } from '../../features/demo/account';
import { checkoutTotals, placeFromCheckout } from '../../features/demo/checkout';
import { goBack, Screen, kit } from '../../features/demo/kit';

/**
 * Card – verify with your bank (Figma 2031:19066). Any 6 digits confirm the payment;
 * 000000 shows "Payment – failed" so the failure path can be demoed.
 */
export default function VerifyCard() {
  const account = useAccount();
  const t = checkoutTotals();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(42);
  useEffect(() => {
    const i = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  if (!t) {
    return <Redirect href="/" />;
  }
  const card = defaultCard(account);

  const confirm = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (code === '000000') return router.replace({ pathname: '/payment/failed', params: { last4: card.last4 } });
      const r = placeFromCheckout('card');
      if (r) router.replace({ pathname: '/payment/success', params: { id: r.id, via: 'card' } });
    }, 1200);
  };

  return (
    <Screen
      title="Verify payment"
      footer={
        <>
          <Button label="Confirm payment" fullWidth loading={busy} loadingLabel="Confirming…" disabled={code.length < 6} onPress={confirm} />
          <Button label="Cancel" variant="text" size="large" onPress={() => goBack('/payment')} />
        </>
      }
    >
      <Text variant="h2">Enter the code from your bank</Text>
      <Text variant="body3" color="secondary">
        GTBank sent a 6-digit code to {account.profile.maskedPhone} to confirm {formatNaira(t.totals.totalKobo)} to MedFind.
      </Text>
      <CodeInput length={6} groupSize={3} value={code} onChangeText={setCode} accessibilityLabel="6-digit bank code" />
      <View style={kit.row}>
        <Text variant="caption1" color="secondary">
          Didn’t get a code?
        </Text>
        <Button
          label={left > 0 ? `Resend in 00:${String(left).padStart(2, '0')}` : 'Resend code'}
          variant="text"
          size="small"
          disabled={left > 0}
          onPress={() => setLeft(42)}
        />
      </View>
    </Screen>
  );
}
