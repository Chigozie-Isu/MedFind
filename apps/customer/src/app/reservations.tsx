import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, space } from '@medfind/ui';
import { Text, useTheme } from '@medfind/ui/native';
import { ReservationRow, TabScreen } from '../features/demo/parts';
import { ActiveCard } from '../features/demo/ActiveCard';
import { isActive, useReservations } from '../features/demo/store';
import { EmptyState, SkeletonRow, useBriefLoading } from '../features/demo/kit';

type Segment = 'all' | 'past' | 'active' | 'cancelled' | 'collected';
const LABELS: Record<Segment, string> = { all: 'All', past: 'Past', active: 'Active', cancelled: 'Cancelled', collected: 'Collected' };

/** My reservations (Figma 538:26148 all, 2476:117677 active, 2476:117970 past, 290:10723 empty, 2035:20653 loading). */
export default function MyReservations() {
  const { colors } = useTheme();
  const { tab } = useLocalSearchParams<{ tab?: Segment }>();
  const all = useReservations();
  const [segment, setSegment] = useState<Segment>(tab && tab in LABELS ? tab : 'all');
  const loading = useBriefLoading(600);
  const lists: Record<Segment, typeof all> = {
    all,
    past: all.filter((r) => !isActive(r)),
    active: all.filter(isActive),
    cancelled: all.filter((r) => r.status === 'cancelled' || r.status === 'declined' || r.status === 'expired'),
    collected: all.filter((r) => r.status === 'collected'),
  };
  const list = lists[segment];
  const subtitle = segment === 'active' ? 'Reservations waiting to be collected' : segment === 'all' ? 'Your past and active reservations' : 'Your past reservations';

  return (
    <TabScreen tab="reservation">
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text variant="h1">My Reservations</Text>
          <Text variant="caption1" color="secondary">
            {subtitle}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(Object.keys(LABELS) as Segment[]).map((s) => {
            const on = s === segment;
            return (
              <Pressable
                key={s}
                onPress={() => setSegment(s)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, { borderColor: on ? colors.input.border : 'transparent' }]}
              >
                <Text variant="body1" color="body">
                  {LABELS[s]}
                </Text>
                <Text variant="caption1" color="secondary">
                  {String(lists[s].length).padStart(3, '0')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : list.length === 0 ? (
          <EmptyState
            title={segment === 'active' ? 'Nothing active right now' : 'No reservations yet'}
            body="When you reserve a medicine, its pickup code and countdown show up here."
            action="Search for medicine"
            onAction={() => router.push('/search')}
          />
        ) : (
          list.map((r) => (isActive(r) ? <ActiveCard key={r.id} r={r} /> : <ReservationRow key={r.id} r={r} />))
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.lg },
  tabs: { gap: space.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
});
