import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, space } from '@medfind/ui';
import { Button, Text, useTheme } from '@medfind/ui/native';
import { defaultAddress, resetAccount, useAccount } from '../../features/demo/account';
import { resetReservations, useReservations } from '../../features/demo/store';
import { ConfirmSheet, LinkRow, Screen, avatarGrace, kit, useFlash } from '../../features/demo/kit';
import { ExtraIcon } from '../../features/demo/icons';
import { demoAuth, setDemoSignedIn, supabase } from '../../lib/supabase';
import { resetWebLocation } from '../../lib/deviceLocation';
import { appVersionLabel } from '../../lib/appVersion';

/** Puts the whole customer demo back to its starting data. */
function resetDemo() {
  resetAccount();
  resetReservations();
}

async function signOut() {
  await setDemoSignedIn(false);
  resetWebLocation();
  if (!demoAuth) await supabase?.auth.signOut().catch(() => {});
  router.replace('/welcome');
}

/** Settings / Profile (Figma 2086:25252), with the sign out (2052:23011) and delete account (2052:23061) confirms. */
export default function Settings() {
  const { colors } = useTheme();
  const account = useAccount();
  const reservations = useReservations();
  const [confirm, setConfirm] = useState<'signout' | 'delete' | 'reset' | null>(null);
  const [flash, showFlash] = useFlash();
  const p = account.profile;
  const addr = defaultAddress(account);

  const stat = (value: string, label: string, onPress: () => void, last?: boolean) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.stat, !last && { borderRightWidth: 1, borderRightColor: colors.surface.border }]}
    >
      <Text variant="h4">{value}</Text>
      <Text variant="caption1" color="secondary">
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Screen title="Profile" onBack={false} overlay={flash} onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <View style={[styles.profile, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
        <View style={kit.row}>
          <Image source={avatarGrace} style={styles.avatar} accessibilityIgnoresInvertColors />
          <View style={styles.flex}>
            <View style={kit.row}>
              <Text variant="h4" style={styles.flex}>
                {p.displayName || p.fullName || 'New customer'}
              </Text>
              <Pressable onPress={() => router.push('/settings/profile')} accessibilityRole="button" style={kit.row}>
                <ExtraIcon name="edit" size={16} color={colors.text.brand} />
                <Text variant="label2" color="brand">
                  Edit
                </Text>
              </Pressable>
            </View>
            <Text variant="caption1" color="secondary">
              {p.email}
            </Text>
            <Text variant="caption1" color="secondary">
              {p.phone}
            </Text>
          </View>
        </View>
        <View style={[styles.stats, { borderTopColor: colors.surface.border }]}>
          {stat(formatNaira(account.walletKobo), 'Wallet', () => router.push('/wallet'))}
          {stat(String(reservations.length), 'Reservations', () => router.navigate('/reservations'))}
          {stat(String(account.saved.length), 'Saved', () => router.navigate('/saved'), true)}
        </View>
      </View>

      <Text variant="label1" color="secondary">
        Account
      </Text>
      <LinkRow extraIcon="user" title="Personal" subtitle="Email, Phone number, Health" onPress={() => router.push('/settings/profile')} />
      <LinkRow icon="wallet" title="Payments" subtitle="Cards, wallet and bank transfers" onPress={() => router.push('/settings/payments')} />
      <LinkRow icon="location" title="Addresses" subtitle={addr ? addr.line.slice(0, 14) + '...' : 'Add your first address'} onPress={() => router.push('/settings/addresses')} />
      <Text variant="label1" color="secondary">
        Preferences
      </Text>
      <LinkRow extraIcon="palette" title="Appearance" subtitle="Theme" onPress={() => router.push('/settings/appearance')} />
      <LinkRow icon="notification" title="Notifications" subtitle="Push and email" onPress={() => router.push('/settings/notifications')} />
      <Text variant="label1" color="secondary">
        Support
      </Text>
      <LinkRow icon="message" title="Help and Support" subtitle="Questions, chat and calls" onPress={() => router.push('/settings/help')} />
      <LinkRow extraIcon="refresh" title="Reset demo data" subtitle="Start the demo again from the beginning" onPress={() => setConfirm('reset')} />

      <View style={styles.danger}>
        {/* Each button sits in its own View so the column can centre it (Button aligns itself to the start). */}
        <View>
          <Button label="Sign Out" variant="destructive-secondary" onPress={() => setConfirm('signout')} />
        </View>
        <View>
          <Button label="Delete account" variant="destructive-inline" size="large" onPress={() => setConfirm('delete')} />
        </View>
      </View>
      <Text variant="caption2" color="tertiary" style={kit.center}>
        MedFind v.1.2.0 · LEGAL · CONTACT US
      </Text>
      <Text variant="caption2" color="tertiary" style={kit.center}>
        {appVersionLabel()}
      </Text>

      <ConfirmSheet
        visible={confirm === 'signout'}
        title="Sign out?"
        body="You’ll need your email or phone number and password to sign back in."
        confirmLabel="Sign out"
        cancelLabel="Go back"
        destructive
        onConfirm={() => (setConfirm(null), signOut())}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="Delete your account?"
        body="This removes your profile, saved cards, addresses and reservation history. You can’t undo it."
        confirmLabel="Delete account"
        cancelLabel="Go back"
        destructive
        onConfirm={() => (setConfirm(null), resetDemo(), signOut())}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'reset'}
        title="Reset demo data?"
        body="Your wallet, cards, addresses, saved medicines and reservations go back to how the demo starts. You stay signed in."
        confirmLabel="Reset demo"
        cancelLabel="Go back"
        onConfirm={() => (setConfirm(null), resetDemo(), showFlash('Demo data reset', 'success'))}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  danger: { alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  profile: { padding: space.md, borderRadius: radii.xl, gap: space.md },
  avatar: { width: 64, height: 64, borderRadius: radii.pill },
  stats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: space.md },
  stat: { flex: 1, alignItems: 'center', gap: space.xxs },
});
