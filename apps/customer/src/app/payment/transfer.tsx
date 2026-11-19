import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, space } from '@medfind/ui';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { transferAccount } from '../../features/demo/data';
import { checkoutTotals } from '../../features/demo/checkout';
import { useAccount } from '../../features/demo/account';
import { Note, Screen, kit, useFlash } from '../../features/demo/kit';
import { ExtraIcon } from '../../features/demo/icons';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Bank transfer – details (Figma 2030:18637): one-time account that expires in 30 minutes. */
export default function Transfer() {
  const { colors } = useTheme();
  const account = useAccount();
  const t = checkoutTotals();
  const [left, setLeft] = useState(29 * 60 + 41);
  const [flash, showFlash] = useFlash();
  useEffect(() => {
    const i = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  if (!t) {
    router.replace('/');
    return null;
  }
  const amount = formatNaira(t.totals.totalKobo);
  const copy = async () => {
    try {
      await navigator?.clipboard?.writeText(transferAccount.number.replace(/\s/g, ''));
    } catch {
      // Clipboard isn't available everywhere; the toast still confirms the tap.
    }
    showFlash('Account number copied');
  };

  return (
    <Screen
      title="Bank transfer"
      overlay={flash}
      footer={
        <>
          <Button label="I’ve sent the money" fullWidth onPress={() => router.replace('/payment/transfer-confirming')} />
          <Button label="Change payment method" variant="text" size="large" onPress={() => router.back()} />
        </>
      }
    >
      <View style={[styles.box, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <Text variant="caption1" color="secondary">
          Send exactly
        </Text>
        <Text variant="h1">{amount}</Text>
        <Note icon="time-circle">This account expires in {mmss(left)}</Note>
      </View>
      <View style={[styles.box, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <View style={kit.between}>
          <Text variant="label2" color="secondary">
            Bank
          </Text>
          <Text variant="label1">{transferAccount.bank}</Text>
        </View>
        <View style={kit.between}>
          <View>
            <Text variant="label2" color="secondary">
              Account number
            </Text>
            <Text variant="h3">{transferAccount.number}</Text>
          </View>
          <Button label="Copy" variant="secondary" size="small" onPress={copy} />
        </View>
        <View style={kit.between}>
          <Text variant="label2" color="secondary">
            Account name
          </Text>
          <Text variant="label1">MedFind / {account.profile.fullName}</Text>
        </View>
      </View>
      <Text variant="h5">How it works</Text>
      {[
        `Open your bank app and send exactly ${amount} to the account above.`,
        'Use this account number once. It stops working after 30 minutes.',
        'We confirm your payment automatically, usually in under a minute.',
      ].map((s, i) => (
        <View key={s} style={kit.row}>
          <View style={[styles.num, { backgroundColor: colors.brandSubtle }]}>
            <Text variant="caption1" color="brand">
              {i + 1}
            </Text>
          </View>
          <Text variant="body3" style={kit.flex}>
            {s}
          </Text>
        </View>
      ))}
      <Note icon="danger-triangle" tone="warning">
        Send the exact amount. If you send a different amount, we refund it to your bank within 24 hours.
      </Note>
      <View style={kit.row}>
        <ExtraIcon name="bank" size={16} color={colors.text.tertiary} />
        <Text variant="caption2" color="tertiary">
          Demo: no money moves. Tap “I’ve sent the money”.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.md, borderRadius: radii.xl, gap: space.sm },
  num: { width: 24, height: 24, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
