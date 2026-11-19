import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radii, sizes, space, type IconName } from '@medfind/ui';
import { Button, Icon, Text, useTheme } from '@medfind/ui/native';
import { Screen } from '../features/demo/kit';
import { setAccount, useAccount } from '../features/demo/account';
import { isActive, useReservations } from '../features/demo/store';

interface Item {
  icon: IconName;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  href: Href;
}

/** Notifications (Figma 2652:159346). Each one opens the screen it's about. */
export default function Notifications() {
  const { colors } = useTheme();
  const account = useAccount();
  const all = useReservations();
  const active = all.find(isActive);
  const unread = account.unreadNotifications > 0;
  useEffect(() => () => setAccount({ unreadNotifications: 0 }), []);

  const reservationHref: Href = active ? `/reservation/${active.id}` : '/reservations';
  const today: Item[] = [
    {
      icon: 'tick-circle',
      title: 'Reservation confirmed',
      body: `Fuasi Pharmacy confirmed your Augmentin. Show code ${active?.pickupCode ?? 'AB-145'} at the counter.`,
      time: '2 min ago',
      unread,
      href: reservationHref,
    },
    { icon: 'time-circle', title: 'Your code expires soon', body: 'You have 15 minutes left to collect from Fuasi Pharmacy.', time: '18:20', unread, href: reservationHref },
    { icon: 'location', title: 'Rider on the way', body: 'Musa is about 5 minutes away with your order.', time: '17:58', href: reservationHref },
  ];
  const earlier: Item[] = [
    { icon: 'history', title: 'Time to refill', body: 'You may be running low on Augmentin. Reserve it again in one tap.', time: 'Yesterday', href: '/saved' },
    { icon: 'wallet', title: 'Refund sent', body: '₦2,450 for Cetirizine is back in your wallet.', time: '28 Oct', href: '/wallet/activity' },
  ];

  const row = (n: Item) => (
    <Pressable
      key={n.title}
      onPress={() => router.push(n.href)}
      accessibilityRole="button"
      style={[styles.card, { backgroundColor: colors.surface.raised }]}
    >
      <View style={[styles.bubble, { backgroundColor: colors.brandSubtle }]}>
        <Icon name={n.icon} size={sizes.icon.md} color={colors.text.brand} />
      </View>
      <View style={styles.flex}>
        <Text variant="h5">{n.title}</Text>
        <Text variant="body3" color="secondary">
          {n.body}
        </Text>
        <Text variant="caption2" color="tertiary">
          {n.time}
        </Text>
      </View>
      {n.unread && <View style={[styles.dot, { backgroundColor: colors.brand.default }]} accessibilityLabel="Unread" />}
    </Pressable>
  );

  return (
    <Screen
      title="Notifications"
      onBack={() => router.navigate('/')}
      right={<Button label="Mark all read" variant="inline" size="small" onPress={() => setAccount({ unreadNotifications: 0 })} />}
    >
      <Text variant="label1" color="secondary">
        Today
      </Text>
      {today.map(row)}
      <Text variant="label1" color="secondary">
        Earlier
      </Text>
      {earlier.map(row)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
  card: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl, alignItems: 'flex-start' },
  bubble: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: radii.pill, marginTop: space.xs },
});
