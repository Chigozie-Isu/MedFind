import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { mobileText, radii, space } from '@medfind/ui';
import { Text, textStyle, useTheme } from '@medfind/ui/native';
import { Screen } from '../../features/demo/kit';
import { ExtraIcon } from '../../features/demo/icons';

interface Msg {
  me: boolean;
  text: string;
  time: string;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Chat with MedFind support (Figma 2446:87529 start, 2446:87606 conversation). Demo replies. */
export default function SupportChat() {
  const { colors } = useTheme();
  const [msgs, setMsgs] = useState<Msg[]>([{ me: false, text: 'Hi, I’m Tolu from MedFind support. How can I help today?', time: '10:02' }]);
  const [draft, setDraft] = useState('');

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    setMsgs((m) => [...m, { me: true, text: t, time: now() }]);
    const reply =
      msgs.filter((m) => m.me).length === 0
        ? 'Sorry about that. Can you share your reservation number? It starts with MF.'
        : 'Thanks. I’ve looked into it and sorted it out. Anything else I can help with?';
    setTimeout(() => setMsgs((m) => [...m, { me: false, text: reply, time: now() }]), 1200);
  };

  return (
    <Screen
      title="MedFind support"
      footer={
        <View style={[styles.composer, { borderColor: colors.input.border, backgroundColor: colors.surface.raised }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            placeholder="Type a message"
            placeholderTextColor={colors.input.placeholder}
            style={[styles.input, textStyle(mobileText.body3), { color: colors.text.primary }]}
            accessibilityLabel="Message"
          />
          <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={[styles.send, { backgroundColor: colors.brand.default }]}>
            <ExtraIcon name="send" size={18} color={colors.text.onBrand} />
          </Pressable>
        </View>
      }
    >
      <Text variant="caption1" color="secondary">
        Online · replies in about 5 minutes
      </Text>
      {msgs.map((m, i) => (
        <View
          key={i}
          style={[
            styles.bubble,
            m.me
              ? { alignSelf: 'flex-end', backgroundColor: colors.brand.default }
              : { alignSelf: 'flex-start', backgroundColor: colors.surface.raised },
          ]}
        >
          <Text variant="body3" style={{ color: m.me ? colors.text.onBrand : colors.text.primary }}>
            {m.text}
          </Text>
          <Text variant="caption2" style={{ color: m.me ? colors.text.onBrand : colors.text.tertiary }}>
            {m.time}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: { flexDirection: 'row', alignItems: 'center', gap: space.xs, borderWidth: 1, borderRadius: radii.xl, paddingLeft: space.md, padding: space.xxs },
  input: { flex: 1, paddingVertical: space.xs },
  send: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', padding: space.sm, borderRadius: radii.lg, gap: space.xxs },
});
