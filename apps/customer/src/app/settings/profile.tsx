import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space } from '@medfind/ui';
import { Button, Text, TextField } from '@medfind/ui/native';
import { resetDemoProfile, saveDemoProfile, useDemoProfile } from '../../features/demo/profile';
import { setDemoSignedIn, supabase } from '../../lib/supabase';

export default function ProfileSettings() {
  const profile = useDemoProfile();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const save = async () => {
    if (!(name ?? profile.name).trim()) { setMessage('Please enter your name.'); return; }
    await saveDemoProfile({ name: (name ?? profile.name).trim(), email: (email ?? profile.email).trim(), phone: (phone ?? profile.phone).trim() });
    setMessage('Profile saved. Your name will appear on Home.');
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Button icon="chevron-left" variant="text" size="large" onPress={() => router.back()} accessibilityLabel="Back" />
        <Text variant="h3">Your profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h4">Personal details</Text>
        <TextField label="Your name" value={name ?? profile.name} onChangeText={setName} placeholder="Your full name" />
        <TextField label="Email" value={email ?? profile.email} onChangeText={setEmail} placeholder="you@example.com" keyboard="email" />
        <TextField label="Phone" value={phone ?? profile.phone} onChangeText={setPhone} placeholder="080..." keyboard="phone" />
        <Button label="Save profile" fullWidth onPress={save} />
        {!!message && <Text variant="body2">{message}</Text>}
        <Button label="Appearance" variant="outline" fullWidth onPress={() => router.push('/settings/appearance')} />
        <Button label="Sign out" variant="outline" fullWidth onPress={async () => { if (supabase) await supabase.auth.signOut(); else await setDemoSignedIn(false); router.replace('/welcome'); }} />
        <Button label="Reset demo profile" variant="text" fullWidth onPress={async () => { await resetDemoProfile(); setName(null); setEmail(null); setPhone(null); setMessage('Demo profile reset.'); }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  content: { padding: space.md, gap: space.md },
});
