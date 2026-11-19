import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@medfind/ui/native';
import { SUPPORT_PHONE } from '../../features/demo/data';
import { ConfirmSheet, LinkRow, Screen, kit, useFlash } from '../../features/demo/kit';

const FAQ: Array<[string, string]> = [
  ['How do reservations work?', 'Search for a medicine, pick a pharmacy and reserve. The pharmacy confirms within 10 minutes and holds it for 2 hours. Show your pickup code at the counter.'],
  ['When do I get a refund?', 'If a pharmacy declines, your hold runs out, or you cancel, every refund goes straight to your MedFind wallet.'],
  ['My pickup code isn’t working', 'Check you’re at the right pharmacy and the code hasn’t expired. Still stuck? Chat with us and we’ll refresh it.'],
  ['Paying by bank transfer', 'We give you a one-time account number. Send the exact amount within 30 minutes and we confirm it automatically.'],
  ['Changing or cancelling a reservation', 'Open the reservation and tap Cancel. You won’t be charged, and any hold is released straight away.'],
];

/** Settings – help and support (Figma 2034:20615) with the call overlay. */
export default function Help() {
  const [open, setOpen] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [flash, showFlash] = useFlash();
  return (
    <Screen
      title="Help and support"
      overlay={flash}
      footer={<Button label="Chat with us" iconLeft="message" fullWidth onPress={() => router.push('/settings/chat')} />}
    >
      <Text variant="label1" color="secondary">
        Common questions
      </Text>
      {FAQ.map(([q, a]) => (
        <View key={q} style={kit.gapSm}>
          <LinkRow title={q} onPress={() => setOpen(open === q ? null : q)} />
          {open === q && (
            <Text variant="body3" color="secondary">
              {a}
            </Text>
          )}
        </View>
      ))}
      <Text variant="label1" color="secondary">
        Contact us
      </Text>
      <LinkRow icon="message" title="Chat with us" subtitle="Replies in about 5 minutes" onPress={() => router.push('/settings/chat')} />
      <LinkRow extraIcon="call" title={`Call ${SUPPORT_PHONE}`} subtitle="08:00 to 22:00, every day" onPress={() => setCalling(true)} />
      <LinkRow extraIcon="mail" title="Email help@medfind.ng" subtitle="Replies within a day" onPress={() => showFlash('Opening your email app', 'info')} />
      <ConfirmSheet
        visible={calling}
        title="Call MedFind support?"
        body={`${SUPPORT_PHONE} · 08:00 to 22:00, every day.`}
        confirmLabel={`Call ${SUPPORT_PHONE}`}
        onConfirm={() => (setCalling(false), showFlash('Calling MedFind support', 'info'))}
        onClose={() => setCalling(false)}
      />
    </Screen>
  );
}
