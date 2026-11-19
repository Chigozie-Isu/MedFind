import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, sizes, space } from '@medfind/ui';
import { Button, Icon, Text, useTheme } from '@medfind/ui/native';
import type { IconName } from '@medfind/ui';
import type { CustomerLocation } from '@medfind/core';
import { LocationIllustration, type LocationIllustrationVariant } from './LocationIllustration';

/** Layout shared by the illustrated Location access screens (Figma 375 x 812 frames). */
export function IllustratedScreen({
  illustration,
  title,
  body,
  children,
  footer,
  footerHasLink,
}: {
  illustration: LocationIllustrationVariant;
  title: string;
  body: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Footers ending in the "Enter my address instead" link sit a little higher, as in Figma. */
  footerHasLink?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.illustration}>
        <LocationIllustration variant={illustration} />
      </View>
      <View style={styles.content}>
        <Text variant="h1" accessibilityRole="header">{title}</Text>
        <Text variant="body3" color="secondary">{body}</Text>
      </View>
      {children}
      <View style={styles.spacer} />
      <View style={[styles.footer, { paddingBottom: footerHasLink ? space.lg : space.md }]}>{footer}</View>
    </SafeAreaView>
  );
}

/** "Enter my address instead" text button. */
export function AddressLink({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.center}>
      <Button label="Enter my address instead" variant="text" size="large" onPress={onPress} />
    </View>
  );
}

export function Benefit({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.benefit}>
      <Icon name={icon} size={sizes.icon.md} color={colors.text.brand} />
      <Text variant="body3" color="heading" style={styles.flex}>{text}</Text>
    </View>
  );
}

/** "Your location" card on the found / address set screens. */
export function LocationCard({ location, onChange }: { location: CustomerLocation; onChange: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface.raised, borderColor: colors.text.tertiary }]}>
      <Icon name="location" size={sizes.icon.lg} color={colors.text.brand} />
      <View style={styles.details}>
        <Text variant="label1" numberOfLines={1}>{location.label}</Text>
        {location.addressLine ? (
          <Text variant="caption1" color="secondary" numberOfLines={1}>{location.addressLine}</Text>
        ) : null}
      </View>
      <Button label="Change" variant="inline" size="small" onPress={onChange} accessibilityLabel="Change location" />
    </View>
  );
}

/** One address suggestion row. */
export function SuggestionRow({
  label,
  addressLine,
  busy,
  onPress,
}: {
  label: string;
  addressLine: string | null;
  busy?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: !!busy }}
      style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.surface.pressed }]}
    >
      <Icon name="location" size={sizes.icon.md} color={colors.text.secondary} />
      <View style={styles.details}>
        <Text variant="label1">{label}</Text>
        {addressLine ? <Text variant="caption1" color="secondary">{addressLine}</Text> : null}
      </View>
      {busy && <ActivityIndicator size="small" color={colors.brand.default} />}
    </Pressable>
  );
}

/** Suggestion rows are 69px tall in Figma: 41px of text plus 14px above and below. */
const SUGGESTION_PADDING_Y = 14;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  // Figma: illustration 37px under the status bar, text 28px under the illustration.
  illustration: { alignItems: 'center', marginTop: space.xl + space.xxs },
  content: { paddingHorizontal: space.md, marginTop: space.lg + space.xxs, gap: space.xs },
  spacer: { flex: 1 },
  footer: { paddingHorizontal: space.md, gap: space.md },
  center: { flexDirection: 'row', justifyContent: 'center' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    marginHorizontal: space.md,
    marginTop: space.lg,
    borderRadius: radii.xl,
    borderWidth: sizes.border.hairline,
  },
  details: { flex: 1, gap: 2 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: SUGGESTION_PADDING_Y },
});
