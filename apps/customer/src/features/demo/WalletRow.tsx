import { StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, sizes, space } from '@medfind/ui';
import { Icon, Text, useTheme } from '@medfind/ui/native';
import type { DemoWalletEntry } from './data';
import { ExtraIcon } from './icons';

/** One line of wallet activity: + for top-ups, refresh for refunds and payments. */
export function WalletRow({ e }: { e: DemoWalletEntry }) {
  const { colors } = useTheme();
  const inflow = e.amountKobo > 0;
  return (
    <View style={[styles.row, { backgroundColor: colors.surface.raised }]}>
      <View style={[styles.bubble, { backgroundColor: colors.brandSubtle }]}>
        {e.kind === 'topup' ? (
          <Icon name="add" size={sizes.icon.md} color={colors.text.brand} />
        ) : (
          <ExtraIcon name="refresh" size={sizes.icon.md} color={colors.text.brand} />
        )}
      </View>
      <View style={styles.flex}>
        <Text variant="h5">{e.title}</Text>
        <Text variant="caption1" color="tertiary">
          {e.date}
        </Text>
      </View>
      <Text variant="label1" color={inflow ? 'success' : 'error'}>
        {inflow ? '' : '-'}
        {formatNaira(Math.abs(e.amountKobo))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  bubble: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
