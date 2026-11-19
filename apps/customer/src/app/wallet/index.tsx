import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, space } from '@medfind/ui';
import { Button, Text, Toggle, useTheme } from '@medfind/ui/native';
import { setAccount, useAccount } from '../../features/demo/account';
import { LinkRow, Screen, SectionTitle, SkeletonRow, useBriefLoading } from '../../features/demo/kit';
import { WalletRow } from '../../features/demo/WalletRow';

/** Wallet (Figma 547:17128) with its loading state (2035:20584). */
export default function Wallet() {
  const { colors } = useTheme();
  const account = useAccount();
  const loading = useBriefLoading(500);
  return (
    <Screen title="Wallet">
      <View style={[styles.card, { backgroundColor: colors.brand.pressed }]}>
        <Text variant="label2" style={{ color: colors.text.onBrand }}>
          Available
        </Text>
        <Text variant="h1" style={{ color: colors.text.onBrand }}>
          {formatNaira(account.walletKobo)}
        </Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label="Add money" iconLeft="add" fullWidth onPress={() => router.push('/wallet/top-up')} />
          </View>
          <View style={[styles.flex, styles.light, { backgroundColor: colors.surface.raised }]}>
            <Button label="Withdraw" variant="secondary" fullWidth onPress={() => router.push('/wallet/withdraw')} />
          </View>
        </View>
      </View>
      <LinkRow
        title="Preferred mode of payment"
        subtitle="Have wallet preselected"
        right={<Toggle value={account.walletFirst} onChange={(v) => setAccount({ walletFirst: v })} accessibilityLabel="Have wallet preselected" />}
      />
      <SectionTitle action="View all" onAction={() => router.push('/wallet/activity')}>
        Activity
      </SectionTitle>
      {loading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : (
        account.wallet.slice(0, 3).map((e) => <WalletRow key={e.id} e={e} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Withdraw sits on a white chip so its brand-blue label keeps contrast on the dark card.
  light: { borderRadius: radii.pill, overflow: 'hidden' },
  card: { padding: space.md, borderRadius: radii.xl, gap: space.sm },
  row: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
});
