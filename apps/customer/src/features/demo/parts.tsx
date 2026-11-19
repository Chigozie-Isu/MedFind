import { router, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, sizes, space, type CustomerTab, type IconName, type StatusTone } from '@medfind/ui';
import { Badge, Button, Icon, TabBar, Text, Toast, useTheme } from '@medfind/ui/native';
import { medicineImages } from './data';
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

/** Where a reservation card leads: the pickup code, the Rate screen, or the ended screen. */
export function detailHref(r: DemoReservation): Href {
  if (r.status === 'waiting' || r.status === 'ready') return `/reservation/${r.id}`;
  if (r.status === 'collected') return `/rate/${r.id}`;
  return `/ended/${r.id}`;
}

/** Image box for medicines and pharmacies: the Figma photo where there is one, else an icon. */
export function Thumb({ icon = 'box', size = 42, medicineId }: { icon?: IconName; size?: number; medicineId?: string }) {
  const { colors } = useTheme();
  const src = medicineId ? medicineImages[medicineId] : undefined;
  return (
    <View style={[styles.thumb, { width: size, height: size, backgroundColor: colors.surface.muted }]}>
      {src ? (
        <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <Icon name={icon} size={size > 60 ? sizes.icon.xl : sizes.icon.lg} color={colors.text.secondary} />
      )}
    </View>
  );
}

const shortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

/**
 * A tappable card that also holds buttons. On the web a Pressable becomes a <button>, and a
 * button can't sit inside another, so the tap target is a layer behind the content.
 */
export function PressCard({ onPress, style, children, label }: { onPress: () => void; style: object; children: ReactNode; label?: string }) {
  return (
    <View style={style}>
      <Pressable onPress={onPress} style={StyleSheet.absoluteFill} accessibilityLabel={label} />
      {children}
    </View>
  );
}

/** History list card (Figma "List" in Home 91:14 and My reservations 538:26148). */
export function ReservationRow({ r }: { r: DemoReservation }) {
  const { colors } = useTheme();
  const active = r.status === 'waiting' || r.status === 'ready';
  return (
    <PressCard
      onPress={() => router.push(detailHref(r))}
      label={`${r.medicineName}, ${statusBadge[r.status].label}`}
      style={[styles.row, { backgroundColor: colors.surface.raised }]}
    >
      <View pointerEvents="none">
        <Thumb medicineId={r.medicineId} />
      </View>
      <View style={styles.rowBody} pointerEvents="box-none">
        <View style={styles.rowTop} pointerEvents="none">
          <Text variant="h5" style={styles.flex} numberOfLines={1}>
            {r.medicineName}
          </Text>
          <StatusBadge status={r.status} />
        </View>
        <Text variant="caption1" color="secondary" pointerEvents="none">
          {r.pharmacyName}
        </Text>
        <View style={styles.rowTop} pointerEvents="box-none">
          <Text variant="caption1" color="tertiary" style={styles.flex} pointerEvents="none">
            {shortDate(r.placedAt)}
          </Text>
          {active ? (
            <Button label="View code" size="small" onPress={() => router.push(`/reservation/${r.id}`)} />
          ) : (
            <Button
              label="Repeat"
              size="small"
              iconLeft="history"
              onPress={() => router.push({ pathname: '/reserve', params: { inventory: `${r.pharmacyId}:${r.medicineId}` } })}
            />
          )}
        </View>
      </View>
    </PressCard>
  );
}

/** Screen with the customer tab bar pinned at the bottom. */
export function TabScreen({ tab, children }: { tab: CustomerTab; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.flex}>{children}</View>
      <View style={styles.tabBar}>
        <TabBar
          active={tab}
          onChange={(t) => {
            if (t === 'home') router.navigate('/');
            if (t === 'reservation') router.navigate('/reservations');
            if (t === 'saved') router.navigate('/saved');
          }}
        />
      </View>
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
