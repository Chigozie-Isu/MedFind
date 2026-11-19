import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, sizes, space, type CustomerTab, type IconName, type StatusTone } from '@medfind/ui';
import { Badge, Button, Icon, TabBar, Text, Toast, useTheme } from '@medfind/ui/native';
import type { DemoReservation, DemoStatus } from './store';

const statusBadge: Record<DemoStatus, { label: string; tone: StatusTone }> = {
  waiting: { label: 'Waiting', tone: 'info' },
  ready: { label: 'Ready for pickup', tone: 'success' },
  collected: { label: 'Collected', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'error' },
  declined: { label: 'Declined', tone: 'error' },
  expired: { label: 'Expired', tone: 'error' },
};

export function StatusBadge({ status }: { status: DemoStatus }) {
  const b = statusBadge[status];
  return <Badge label={b.label} tone={b.tone} dot="left" />;
}

/** Image box for medicines and pharmacies. The seed has photo paths but no files, so it shows an icon. */
export function Thumb({ icon = 'box', size = 42 }: { icon?: IconName; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumb, { width: size, height: size, backgroundColor: colors.surface.muted }]}>
      <Icon name={icon} size={size > 60 ? sizes.icon.xl : sizes.icon.lg} color={colors.text.secondary} />
    </View>
  );
}

const shortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

/** History list card (Figma "List" in Home 91:14 and My reservations 538:26148). */
export function ReservationRow({ r }: { r: DemoReservation }) {
  const { colors } = useTheme();
  const active = r.status === 'waiting' || r.status === 'ready';
  return (
    <Pressable
      onPress={active ? () => router.push(`/reservation/${r.id}`) : undefined}
      style={[styles.row, { backgroundColor: colors.surface.raised }]}
    >
      <Thumb />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text variant="h5" style={styles.flex} numberOfLines={1}>
            {r.medicineName}
          </Text>
          <StatusBadge status={r.status} />
        </View>
        <Text variant="caption1" color="secondary">
          {r.pharmacyName}
        </Text>
        <View style={styles.rowTop}>
          <Text variant="caption1" color="tertiary" style={styles.flex}>
            {shortDate(r.placedAt)}
          </Text>
          {active ? (
            <Button label="View code" size="small" onPress={() => router.push(`/reservation/${r.id}`)} />
          ) : (
            <Button
              label="Repeat"
              size="small"
              iconLeft="history"
              onPress={() => router.push({ pathname: '/search', params: { q: r.medicineName.split(' ')[0] } })}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

/** Screen with the customer tab bar pinned at the bottom. */
export function TabScreen({ tab, children }: { tab: CustomerTab; children: ReactNode }) {
  const [soon, showSoon] = useComingSoon();
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.flex}>{children}</View>
      <View style={styles.tabBar}>
        <TabBar
          active={tab}
          onChange={(t) => {
            if (t === 'home') router.navigate('/');
            if (t === 'reservation') router.navigate('/reservations');
            if (t === 'saved') showSoon('Saved medicines are coming soon');
          }}
        />
      </View>
      {soon}
    </SafeAreaView>
  );
}

/** A short "coming soon" toast for buttons whose screens aren't in the demo. */
export function useComingSoon(): [ReactNode, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(t);
  }, [message]);
  const toast = message ? (
    <View style={styles.toast} pointerEvents="none">
      <Toast message={message} tone="info" />
    </View>
  ) : null;
  return [toast, setMessage];
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: space.md, right: space.md, top: space.xl },
  flex: { flex: 1 },
  thumb: { borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  rowBody: { flex: 1, gap: space.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  tabBar: { paddingHorizontal: space.md, paddingBottom: space.xs },
});
