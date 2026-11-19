import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Icon, SearchField, Text, useTheme } from '@medfind/ui/native';
import { currentCustomerId } from '../lib/supabase';
import { customer } from '../features/demo/data';
import { ReservationRow, TabScreen } from '../features/demo/parts';
import { ActiveCard } from '../features/demo/ActiveCard';
import { isActive, useReservations } from '../features/demo/store';
import { rememberSearch, setAccount, useAccount } from '../features/demo/account';
import { SectionTitle, SkeletonRow, Skeleton, useBriefLoading, useFlash, EmptyState } from '../features/demo/kit';
import { ExtraIcon } from '../features/demo/icons';

type Gate = 'checking' | 'signed_in' | 'welcome';

/**
 * Signed-out customers start at the Splash (then Onboarding the first time, as in Figma).
 * Without Supabase settings, Log in and Sign up accept anything and sign in as Grace.
 */
function useAuthGate(): Gate {
  const [gate, setGate] = useState<Gate>('checking');
  useEffect(() => {
    currentCustomerId().then((id) => setGate(id ? 'signed_in' : 'welcome'));
  }, []);
  return gate;
}

function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Home (Figma 91:14) and its states: new user, loading, searches cleared, active reservation. */
export default function Home() {
  const { newUser } = useLocalSearchParams<{ newUser?: string }>();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const all = useReservations();
  const account = useAccount();
  const gate = useAuthGate();
  const loading = useBriefLoading(600);
  const [flash, showFlash] = useFlash();
  if (gate === 'checking') return null;
  if (gate === 'welcome') return <Redirect href="/welcome" />;

  // "Home – new user" (from sign-up): no history until the first reservation.
  const freshUser = newUser === '1' && all.every((r) => r.placedAt.getTime() < APP_START);
  const active = all.filter(isActive);
  const history = freshUser ? [] : all.filter((r) => !isActive(r));

  const search = (q: string) => {
    if (!q.trim()) return router.push('/search');
    rememberSearch(q);
    router.push({ pathname: '/search', params: { q: q.trim() } });
  };

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
            <Pressable accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => router.push('/notifications')}>
              <Icon name="notification" size={sizes.icon.lg} color={colors.icon.default} />
              {account.unreadNotifications > 0 && <View style={[styles.dot, { backgroundColor: colors.text.error }]} />}
            </Pressable>
            <Pressable accessibilityLabel="Profile and settings" accessibilityRole="button" onPress={() => router.push('/settings')}>
              <ExtraIcon name="user" size={sizes.icon.lg} color={colors.icon.default} />
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex}>
            <SearchField
              placeholder="Search medicines, e.g. Paracetamol"
              value={query}
              onChangeText={setQuery}
              onSubmit={() => search(query)}
            />
          </View>
          <Pressable
            accessibilityLabel="Scan a medicine pack"
            accessibilityRole="button"
            onPress={() => {
              // Demo scan: "reads" a Paracetamol pack, then searches for it.
              showFlash('Scanned: Paracetamol 500mg pack', 'success');
              setTimeout(() => search('Paracetamol'), 900);
            }}
            style={[styles.scan, { borderColor: colors.text.body }]}
          >
            <Icon name="camera" size={sizes.icon.lg} color={colors.icon.default} />
          </Pressable>
        </View>

        {account.recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text variant="label1" color="secondary" style={styles.flex}>
                Recent searches
              </Text>
              <Button label="Clear all" variant="inline" size="small" onPress={() => setAccount({ recentSearches: [] })} />
            </View>
            <View style={styles.tags}>
              {account.recentSearches.map((t) => (
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
        )}

        {loading ? (
          <View style={styles.history}>
            <Skeleton width={120} height={20} />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <View style={styles.history}>
                <SectionTitle action="View all" onAction={() => router.navigate({ pathname: '/reservations', params: { tab: 'active' } })}>
                  Active now
                </SectionTitle>
                {active.slice(0, 2).map((r) => (
                  <ActiveCard key={r.id} r={r} />
                ))}
              </View>
            )}
            <View style={styles.history}>
              <SectionTitle action={history.length ? 'View all' : undefined} onAction={() => router.navigate('/reservations')}>
                History
              </SectionTitle>
              {history.length === 0 && active.length === 0 ? (
                <EmptyState
                  title="No reservations yet"
                  body="Search for a medicine to see which pharmacies near you have it in stock."
                  action="Search for medicine"
                  onAction={() => router.push('/search')}
                />
              ) : (
                history.slice(0, 3).map((r) => <ReservationRow key={r.id} r={r} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
      {flash}
    </TabScreen>
  );
}

const APP_START = Date.now();

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  content: { padding: space.md, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerIcons: { flexDirection: 'row', gap: space.md },
  dot: { position: 'absolute', right: 2, top: 1, width: 8, height: 8, borderRadius: radii.pill },
  scan: { width: 48, height: 48, borderRadius: radii.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { gap: space.xs },
  tags: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: space.xs, paddingVertical: space.xxs },
  history: { gap: space.md },
});
