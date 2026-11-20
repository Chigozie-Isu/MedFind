import { useState } from 'react';
import { View } from 'react-native';
import { Button, Checkbox, Text, TextField } from '@medfind/ui/native';
import { setAccount, type Account } from '../../features/demo/account';
import { LinkRow, Pill, Screen, goBack, kit, useFlash } from '../../features/demo/kit';

/** Settings – add address / Delivery – add address (Figma 2034:20248, 2668:161761). */
export default function AddAddress() {
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Other');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Port Harcourt');
  const [state, setState] = useState('Rivers');
  const [landmark, setLandmark] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, showFlash] = useFlash();

  const save = () => {
    if (!street.trim()) return setError('Enter the house number and street');
    const id = `addr${Date.now()}`;
    const line = [street.trim(), area.trim(), city.trim(), state.trim()].filter(Boolean).join(', ');
    setAccount((a: Account) => ({
      addresses: [...a.addresses, { id, label, line }],
      defaultAddressId: makeDefault || !a.addresses.length ? id : a.defaultAddressId,
      checkout: a.checkout ? { ...a.checkout, addressId: id } : null,
    }));
    showFlash('Address saved');
    setTimeout(() => goBack('/settings/addresses'), 600);
  };

  return (
    <Screen title="Add address" overlay={flash} footer={<Button label="Save address" fullWidth onPress={save} />}>
      <LinkRow
        icon="location"
        title="Use my current location"
        onPress={() => {
          setStreet('50 Evo Road');
          setArea('GRA Phase 2');
          setError(null);
        }}
      />
      <Text variant="label1" color="secondary">
        Save as
      </Text>
      <View style={kit.wrap}>
        {(['Home', 'Work', 'Other'] as const).map((l) => (
          <Pill key={l} label={l} selected={label === l} onPress={() => setLabel(l)} />
        ))}
      </View>
      <TextField
        label="Street address"
        required
        placeholder="House number and street"
        value={street}
        onChangeText={(v) => (setStreet(v), setError(null))}
        errorText={error ?? undefined}
      />
      <TextField label="Area" placeholder="For example, GRA Phase 2" value={area} onChangeText={setArea} />
      <View style={kit.row}>
        <View style={kit.flex}>
          <TextField label="City" value={city} onChangeText={setCity} />
        </View>
        <View style={kit.flex}>
          <TextField label="State" value={state} onChangeText={setState} />
        </View>
      </View>
      <TextField label="Landmark" placeholder="Optional, like “opposite the filling station”" value={landmark} onChangeText={setLandmark} />
      <View style={kit.row}>
        <Checkbox checked={makeDefault} onChange={setMakeDefault} accessibilityLabel="Make this my default address" />
        <Text variant="body3">Make this my default address</Text>
      </View>
    </Screen>
  );
}
