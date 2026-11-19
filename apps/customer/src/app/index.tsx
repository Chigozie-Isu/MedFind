import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space } from '@medfind/ui';
import { Button, TabBar, Text } from '@medfind/ui/native';
import type { CustomerTab } from '@medfind/ui';
import { currentCustomerId, supabase } from '../lib/supabase';
import { hasSeenOnboarding } from '../lib/onboarding';

type Gate = 'checking' | 'signed_in' | 'onboarding' | 'welcome';

/** Signed-out customers go to Onboarding (first launch) or the Splash. */
function useAuthGate(): Gate {
  const [gate, setGate] = useState<Gate>('checking');
  useEffect(() => {
    Promise.all([currentCustomerId(), hasSeenOnboarding()]).then(([id, seen]) =>
      setGate(id ? 'signed_in' : seen ? 'welcome' : 'onboarding'),
    );
  }, []);
  return gate;
}

/**
 * Placeholder home until the Home screens are built from Figma.
 * `?newUser=1` stands in for "Home – new user" (customers arriving from sign-up).
 */
export default function Home() {
  const [tab, setTab] = useState<CustomerTab>('home');
  const { newUser } = useLocalSearchParams<{ newUser?: string }>();
  const gate = useAuthGate();
  if (gate === 'checking') return null;
  if (gate === 'onboarding') return <Redirect href="/onboarding" />;
  if (gate === 'welcome') return <Redirect href="/welcome" />;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h1">MedFind</Text>
        <Text variant="body2" color="secondary">
          {newUser === '1' ? 'Welcome to MedFind. Search for your first medicine.' : 'Find a medicine at a pharmacy near you.'}
        </Text>
        <Link href="/settings/appearance" asChild>
          <Button label="Appearance" variant="secondary" size="medium" icon="chevron-right" />
        </Link>
        <Button
          label="Sign out"
          variant="inline"
          size="medium"
          onPress={async () => {
            await supabase?.auth.signOut();
            router.replace('/welcome');
          }}
        />
      </ScrollView>
      <View style={styles.tabBar}>
        <TabBar active={tab} onChange={setTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: space.md, gap: space.md },
  tabBar: { paddingHorizontal: space.md, paddingBottom: space.xs },
});
