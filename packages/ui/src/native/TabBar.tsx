import { Pressable, StyleSheet, View } from 'react-native';
import type { IconName } from '../icons/icons.ts';
import { boxShadow, radii, sizes, space } from '../tokens/layout.ts';
import { mobileText } from '../tokens/typography.ts';
import type { CustomerTab, TabBarProps } from '../types.ts';
import { Icon } from './Icon.tsx';
import { Text, textStyle } from './Text.tsx';
import { useTheme } from './ThemeProvider.tsx';

export const customerTabs: Array<{ key: CustomerTab; label: string; icon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'reservation', label: 'Reservation', icon: 'time-circle' },
  { key: 'saved', label: 'Saved', icon: 'bookmark' },
];

/** Customer tab bar (Figma 2105:26351): Home, Reservation, Saved. */
export function TabBar({ active, onChange }: TabBarProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}
    >
      {customerTabs.map((t) => {
        const selected = t.key === active;
        const fg = selected ? colors.text.onBrand : colors.text.body;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange?.(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={t.label}
            style={[styles.tab, selected && { backgroundColor: colors.brand.default }]}
          >
            <Icon name={t.icon} size={sizes.icon.lg} color={fg} />
            <Text style={[textStyle(mobileText.caption1), { color: fg }]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    borderRadius: radii.xl,
    height: sizes.tabBar.height,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radii.xl,
  },
});
