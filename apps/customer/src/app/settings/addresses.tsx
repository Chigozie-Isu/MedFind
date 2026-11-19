import { router } from 'expo-router';
import { View } from 'react-native';
import { Badge, Button } from '@medfind/ui/native';
import { setAccount, useAccount } from '../../features/demo/account';
import { LinkRow, Note, Screen, kit } from '../../features/demo/kit';

/** Settings – addresses (Figma 2034:20172). Tap an address to make it the default. */
export default function Addresses() {
  const account = useAccount();
  return (
    <Screen title="Addresses" footer={<Button label="Add address" iconLeft="add" fullWidth onPress={() => router.push('/settings/add-address')} />}>
      {account.addresses.map((a) => (
        <View key={a.id} style={kit.gapSm}>
          <LinkRow
            icon={a.label === 'Home' ? 'home-2' : 'location'}
            title={a.label}
            subtitle={a.line}
            onPress={() => setAccount({ defaultAddressId: a.id })}
            right={a.id === account.defaultAddressId ? <Badge label="Default" tone="info" /> : undefined}
          />
        </View>
      ))}
      <Note icon="info-circle">
        Why we ask for your address: we use it to show pharmacies near you, and for delivery when a pharmacy offers it.
      </Note>
    </Screen>
  );
}
