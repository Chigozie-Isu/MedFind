import { router } from 'expo-router';
import { Button } from '@medfind/ui/native';
import { useAccount } from '../../features/demo/account';
import { EmptyState, Screen, kit } from '../../features/demo/kit';
import { WalletRow } from '../../features/demo/WalletRow';
import { View } from 'react-native';

/** Wallet – activity (Figma 2459:116027). */
export default function WalletActivity() {
  const account = useAccount();
  return (
    <Screen
      title="Wallet activity"
      footer={
        <View style={kit.row}>
          <View style={kit.flex}>
            <Button label="Add money" fullWidth onPress={() => router.push('/wallet/top-up')} />
          </View>
          <View style={kit.flex}>
            <Button label="Withdraw" variant="secondary" fullWidth onPress={() => router.push('/wallet/withdraw')} />
          </View>
        </View>
      }
    >
      {account.wallet.length === 0 ? (
        <EmptyState title="No activity yet" body="Top-ups, payments and refunds show up here." />
      ) : (
        account.wallet.map((e) => <WalletRow key={e.id} e={e} />)
      )}
    </Screen>
  );
}
