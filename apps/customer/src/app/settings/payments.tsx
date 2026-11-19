import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, space } from '@medfind/ui';
import { Badge, Button, Text, Toggle, useTheme } from '@medfind/ui/native';
import { cardLabel, setAccount, useAccount } from '../../features/demo/account';
import { LinkRow, Screen } from '../../features/demo/kit';

/** Settings – payments (Figma 2034:20084). */
export default function Payments() {
  const { colors } = useTheme();
  const account = useAccount();
  return (
    <Screen title="Payments">
      <View style={[styles.wallet, { backgroundColor: colors.brand.pressed }]}>
        <Text variant="caption1" style={{ color: colors.text.onBrand }}>
          MedFind wallet
        </Text>
        <Text variant="h1" style={{ color: colors.text.onBrand }}>
          {formatNaira(account.walletKobo)}
        </Text>
        <View style={styles.walletRow}>
          <Button label="Add money" size="small" iconLeft="add" onPress={() => router.push('/wallet/top-up')} />
          <View style={[styles.chip, { backgroundColor: colors.surface.raised }]}>
            <Button label="View wallet" variant="secondary" size="small" onPress={() => router.push('/wallet')} />
          </View>
        </View>
      </View>
      <Text variant="label1" color="secondary">
        Saved cards
      </Text>
      {account.cards.map((c) => (
        <LinkRow
          key={c.id}
          icon="card"
          title={cardLabel(c)}
          subtitle={c.expired ? `Expired ${c.expiry}` : `Expires ${c.expiry}`}
          onPress={c.expired ? undefined : () => setAccount({ defaultCardId: c.id })}
          right={c.id === account.defaultCardId ? <Badge label="Default" tone="info" /> : c.expired ? <Badge label="Expired" tone="error" /> : undefined}
        />
      ))}
      <Button label="Add a card" variant="secondary" iconLeft="add" fullWidth onPress={() => router.push('/settings/add-card')} />
      <Text variant="label1" color="secondary">
        Preferences
      </Text>
      <LinkRow
        icon="wallet"
        title="Pay with wallet first"
        subtitle="Use your balance before your card"
        right={<Toggle value={account.walletFirst} onChange={(v) => setAccount({ walletFirst: v })} accessibilityLabel="Pay with wallet first" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wallet: { padding: space.md, borderRadius: radii.xl, gap: space.xs },
  // White chip keeps the brand-blue label readable on the dark wallet card.
  chip: { borderRadius: radii.pill, overflow: 'hidden' },
  walletRow: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
});
