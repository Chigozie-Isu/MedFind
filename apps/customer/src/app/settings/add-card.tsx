import { useState } from 'react';
import { View } from 'react-native';
import { Button, Checkbox, Text, TextField } from '@medfind/ui/native';
import { setAccount } from '../../features/demo/account';
import { Note, Screen, goBack, kit, useFlash } from '../../features/demo/kit';

const digits = (s: string) => s.replace(/\D/g, '');

/** Card – add a card / Settings – add a card (Figma 2031:18929, 2466:116335). */
export default function AddCard() {
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, showFlash] = useFlash();

  const submit = () => {
    const e: Record<string, string> = {};
    if (digits(num).length < 16) e.num = 'Enter the 16 digits on the front of your card';
    if (!/^\d{2}\/\d{2}$/.test(exp)) e.exp = 'Use MM/YY';
    if (digits(cvv).length !== 3) e.cvv = '3 digits on the back';
    if (!name.trim()) e.name = 'Enter the name on the card';
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = `card${Date.now()}`;
    const d = digits(num);
    setAccount((a) => ({
      cards: [...a.cards, { id, brand: d.startsWith('4') ? 'Visa' : d.startsWith('5') ? 'Mastercard' : 'Verve', last4: d.slice(-4), expiry: exp }],
      defaultCardId: id,
      method: 'card',
    }));
    showFlash('Card added');
    setTimeout(() => goBack('/settings/payments'), 600);
  };

  return (
    <Screen title="Add a card" overlay={flash} footer={<Button label="Add card" fullWidth onPress={submit} />}>
      <TextField
        label="Card number"
        required
        placeholder="0000 0000 0000 0000"
        keyboard="number"
        value={num}
        onChangeText={(v) => setNum(digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))}
        errorText={errors.num}
      />
      <View style={kit.row}>
        <View style={kit.flex}>
          <TextField
            label="Expiry date"
            placeholder="MM/YY"
            keyboard="number"
            value={exp}
            onChangeText={(v) => {
              const d = digits(v).slice(0, 4);
              setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
            }}
            errorText={errors.exp}
          />
        </View>
        <View style={kit.flex}>
          <TextField label="CVV" placeholder="3 digits" keyboard="number" secure value={cvv} onChangeText={(v) => setCvv(digits(v).slice(0, 3))} errorText={errors.cvv} />
        </View>
      </View>
      <TextField label="Name on card" placeholder="As it appears on the card" value={name} onChangeText={setName} errorText={errors.name} />
      <View style={kit.row}>
        <Checkbox checked={save} onChange={setSave} accessibilityLabel="Save this card" />
        <View style={kit.flex}>
          <Text variant="h5">Save this card</Text>
          <Text variant="caption1" color="secondary">
            Use it next time without typing it again
          </Text>
        </View>
      </View>
      <Note icon="shield-tick" tone="info">
        Your card details are safe. They are encrypted and handled by our payment partner. MedFind never stores your full card number.
      </Note>
    </Screen>
  );
}
