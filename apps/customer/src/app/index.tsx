import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Icon, SearchField, Text, useTheme } from '@medfind/ui/native';
import { currentCustomerId, supabase } from '../lib/supabase';
import { hasSeenOnboarding } from '../lib/onboarding';
import { customer } from '../features/demo/data';
import { ReservationRow, TabScreen } from '../features/demo/parts';
import { useReservations } from '../features/demo/store';

type Gate = 'checking' | 'signed_in' | 'onboarding' | 'welcome';

/**
 * Signed-out customers go to Onboarding (first launch) or the Splash.
 * Without Supabase settings the app runs as the demo customer.
 */
function useAuthGate(): Gate {
  const [gate, setGate] = useState<Gate>('checking');
  useEffect(() => {
    Promise.all([currentCustomerId(), hasSeenOnboarding()]).then(([id, seen]) =>
      setGate(id || !supabase ? 'signed_in' : seen ? 'welcome' : 'onboarding'),
    );
  }, []);
  return gate;
}

function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const RECENT = ['Coartem', 'Panadol Extra', 'Loratadine'];

/** Home (Figma 91:14). `?newUser=1` is "Home – new user" (from sign-up): no history yet. */
export default function Home() {
  const { newUser } = useLocalSearchParams<{ newUser?: string }>();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const history = useReservations();
  const gate = useAuthGate();
  if (gate === 'checking') return null;
  if (gate === 'onboarding') return <Redirect href="/onboarding" />;
  if (gate === 'welcome') return <Redirect href="/welcome" />;

  const search = (q: string) => q.trim() && router.push({ pathname: '/search', params: { q: q.trim() } });

  return (
    <TabScreen tab="home">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="label1" color="secondary">
              {greeting()}
            </Text>
            <Text variant="h1">{customer.firstName}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Icon name="notification" size={sizes.icon.lg} color={colors.icon.default} />
            <Link href="/settings/appearance" asChild>
              <Pressable accessibilityLabel="Settings" accessibilityRole="button">
                <Icon name="setting" size={sizes.icon.lg} color={colors.icon.default} />
              </Pressable>
            </Link>
          </View>
        </View>

        <SearchField
          placeholder="Search medicines, e.g. Paracetamol"
          value={query}
          onChangeText={setQuery}
          onSubmit={() => search(query)}
        />

        <View style={styles.section}>
          <Text variant="label1" color="secondary">
            Recent searches
          </Text>
          <View style={styles.tags}>
            {RECENT.map((t) => (
              <Pressable
                key={t}
                onPress={() => search(t)}
                accessibilityRole="button"
                style={[styles.tag, { borderColor: colors.text.body }]}
              >
                <Text variant="caption1" color="tertiary">
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {newUser !== '1' && (
          <View style={styles.history}>
            <View style={styles.sectionHead}>
              <Text variant="h4">History</Text>
              <Button
                label="View all"
                variant="inline"
                size="medium"
                icon="chevron-right"
                onPress={() => router.navigate('/reservations')}
              />
            </View>
            {history.slice(0, 3).map((r) => (
              <ReservationRow key={r.id} r={r} />
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerIcons: { flexDirection: 'row', gap: space.md },
  section: { gap: space.xs },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: space.xs, paddingVertical: space.xxs },
  history: { gap: space.md },
});
