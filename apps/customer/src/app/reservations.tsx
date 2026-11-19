import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, space } from '@medfind/ui';
import { Text, useTheme } from '@medfind/ui/native';
import { ReservationRow, TabScreen } from '../features/demo/parts';
import { isActive, useReservations } from '../features/demo/store';

type Segment = 'all' | 'past' | 'active';

/** My reservations – all (Figma 538:26148). */
export default function MyReservations() {
  const { colors } = useTheme();
  const all = useReservations();
  const [segment, setSegment] = useState<Segment>('all');
  const lists: Record<Segment, typeof all> = {
    all,
    past: all.filter((r) => !isActive(r)),
    active: all.filter(isActive),
  };
  const labels: Record<Segment, string> = { all: 'All', past: 'Past', active: 'Active' };

  return (
    <TabScreen tab="reservation">
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text variant="h1">My Reservations</Text>
          <Text variant="caption1" color="secondary">
            Your past and active reservations
          </Text>
        </View>
        <View style={styles.tabs} accessibilityRole="tablist">
          {(Object.keys(labels) as Segment[]).map((s) => {
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
                  {labels[s]}
                </Text>
                <Text variant="caption1" color="secondary">
                  {String(lists[s].length).padStart(3, '0')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {lists[segment].map((r) => (
          <ReservationRow key={r.id} r={r} />
        ))}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.lg },
  tabs: { flexDirection: 'row', gap: space.xs },
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
