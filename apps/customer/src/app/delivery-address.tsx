import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, OptionRow, Text } from '@medfind/ui/native';
import { Note, Screen, kit } from '../features/demo/kit';
import { goBack } from '../features/demo/kit';
import { setAccount, useAccount } from '../features/demo/account';

/** Delivery – choose address (Figma 2069:23960). "Add new address" opens Add address. */
export default function DeliveryAddress() {
  const account = useAccount();
  const [picked, setPicked] = useState(account.checkout?.addressId ?? account.defaultAddressId);

  return (
    <Screen
      title="Deliver to"
      footer={
        <Button
          label="Deliver here"
          fullWidth
          onPress={() => {
            if (account.checkout) setAccount({ checkout: { ...account.checkout, addressId: picked } });
            goBack('/reserve');
          }}
        />
      }
    >
      {account.addresses.map((a) => (
        <View key={a.id} style={kit.gapSm}>
          {a.id === account.defaultAddressId && (
            <View style={kit.row}>
              <Badge label="Default" tone="info" />
            </View>
          )}
          <OptionRow title={a.label} description={a.line} icon="home-2" selected={picked === a.id} onPress={() => setPicked(a.id)} />
        </View>
      ))}
      <Button label="Add new address" variant="secondary" iconLeft="add" fullWidth onPress={() => router.push('/settings/add-address')} />
      <Text variant="h5">Riders call you if they can’t find you</Text>
      <Note icon="info-circle">We share {account.profile.maskedPhone} with the rider for this order only.</Note>
    </Screen>
  );
}
