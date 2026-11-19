import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { boxShadow, radii, space } from '@medfind/ui';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { transferAccount } from '../../features/demo/data';
import { useAccount } from '../../features/demo/account';
import { Note, Screen, kit, useFlash } from '../../features/demo/kit';

/** Top up – bank transfer details (Figma 2033:19285): Grace's own wallet account number. */
export default function TopUpTransfer() {
  const { colors } = useTheme();
  const account = useAccount();
  const [flash, showFlash] = useFlash();
  return (
    <Screen
      title="Your wallet account"
      overlay={flash}
      footer={
        <>
          <Button
            label="I’ve sent the money"
            fullWidth
            onPress={() => router.replace({ pathname: '/wallet/done', params: { mode: 'topup', kobo: '1000000', from: 'Bank transfer' } })}
          />
          <Button label="Share account details" variant="text" size="large" onPress={() => showFlash('Account details copied to share')} />
        </>
      }
    >
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
            <Text variant="h3">{transferAccount.walletNumber}</Text>
          </View>
          <Button label="Copy" variant="secondary" size="small" onPress={() => showFlash('Account number copied')} />
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
        'Send any amount from your bank app to the account above.',
        'It lands in your MedFind wallet, usually within a minute.',
        'This account number is yours to keep. Save it as a beneficiary.',
      ].map((s, i) => (
        <Text key={s} variant="body3">
          {i + 1}. {s}
        </Text>
      ))}
      <Note icon="danger-triangle" tone="warning">
        Send from an account in your name. Transfers from other people’s accounts can take up to 24 hours to land.
      </Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.md, borderRadius: radii.xl, gap: space.sm },
});
