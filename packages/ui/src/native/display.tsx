import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { boxShadow, radii, sizes, space } from '../tokens/layout.ts';
import { componentText, mobileText, webText } from '../tokens/typography.ts';
import type {
  BadgeProps,
  CalloutCardProps,
  CardProps,
  DrugCardProps,
  FilterChipProps,
  InsightCardProps,
  MedicationCardProps,
  PhotoCardProps,
  StatusDotProps,
  TagProps,
  ToastProps,
} from '../types.ts';
import { Button } from './Button.tsx';
import { Icon } from './Icon.tsx';
import { Text, textStyle } from './Text.tsx';
import { useTheme } from './ThemeProvider.tsx';

/* ---------- Badges, status, chips, tags (Figma section 327:6702) ---------- */

export function Badge({ label, tone = 'neutral', appearance = 'filled', dot = 'none' }: BadgeProps) {
  const { colors } = useTheme();
  const t = colors.tone[tone];
  const filled = appearance === 'filled';
  const dotView = <View style={[styles.badgeDot, { backgroundColor: t.dot }]} />;
  return (
    <View
      style={[
        styles.badge,
        filled ? { backgroundColor: t.bg } : { borderWidth: sizes.border.hairline, borderColor: t.border },
      ]}
    >
      {dot === 'left' && dotView}
      <Text style={[textStyle(mobileText.caption2), { color: filled ? t.text : t.outlineText }]}>{label}</Text>
      {dot === 'right' && dotView}
    </View>
  );
}

export function StatusDot({ tone = 'neutral', accessibilityLabel }: StatusDotProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[styles.statusDot, { backgroundColor: colors.tone[tone].status }]}
    />
  );
}

export function FilterChip({ label, onPress }: FilterChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, { backgroundColor: colors.chip.bg }]}>
      <Text style={[textStyle(mobileText.label2), { color: colors.chip.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Segment tag with a count, e.g. "All 550" (Figma 394:3814). */
export function Tag({ label, count, active, onPress }: TagProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!active }}
      style={[styles.tag, active ? { borderColor: colors.input.border } : { borderColor: 'transparent' }]}
    >
      <Text style={[textStyle(webText.body1), { color: colors.text.body }]}>{label}</Text>
      {count !== undefined && (
        <Text style={[textStyle(webText.body3), { color: colors.text.secondary }]}>{count}</Text>
      )}
    </Pressable>
  );
}

/* ---------- Cards (Figma section 529:23194) ---------- */

export function Card({ children, padded = true, elevated = true, onPress }: CardProps & { children?: ReactNode }) {
  const { colors } = useTheme();
  const style = [
    styles.card,
    { backgroundColor: colors.surface.raised },
    padded && { padding: space.md },
    elevated && { boxShadow: boxShadow('card') },
  ];
  return onPress ? (
    <Pressable onPress={onPress} style={style}>
      {children}
    </Pressable>
  ) : (
    <View style={style}>{children}</View>
  );
}

function ImageBox({ uri, style }: { uri?: string; style: object }) {
  const { colors } = useTheme();
  return (
    <View style={[style, { backgroundColor: colors.surface.muted, overflow: 'hidden' }]}>
      {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
    </View>
  );
}

/** Drug card (Figma 2105:26289): search result with pharmacy, distance and price. */
export function DrugCard({ name, pharmacy, distance, priceKobo, imageUrl, onPress }: DrugCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.drugCard, { backgroundColor: colors.surface.raised }]}>
      <View style={styles.drugDetails}>
        <ImageBox uri={imageUrl} style={styles.drugImage} />
        <View style={styles.drugContent}>
          <Text style={[textStyle(mobileText.h5), { color: colors.text.body }]} numberOfLines={2}>
            {name}
          </Text>
          <Text style={[textStyle(mobileText.body3), { color: colors.text.secondary }]} numberOfLines={1}>
            {distance ? `${pharmacy} · ${distance}` : pharmacy}
          </Text>
        </View>
      </View>
      <Text style={[textStyle(mobileText.h5), { color: colors.text.heading }]}>{formatNaira(priceKobo)}</Text>
    </Pressable>
  );
}

/** Card1 (Figma 2105:26414): popular medication tile with image and add button. */
export function MedicationCard({ title, subtitle, imageUrl, onAdd }: MedicationCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.medCard, { backgroundColor: colors.surface.muted }]}>
      <ImageBox uri={imageUrl} style={styles.medImage} />
      <View style={[styles.medDetails, { backgroundColor: colors.surface.muted }]}>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text style={[textStyle(mobileText.body2), { color: colors.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[textStyle(mobileText.caption1), { color: colors.text.secondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Button icon="add" size="small" onPress={onAdd} accessibilityLabel={`Add ${title}`} />
      </View>
    </View>
  );
}

/** Drug pic card (Figma 2105:26422): uploaded photo with a caption. */
export function PhotoCard({ title, subtitle, imageUrl }: PhotoCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.photoCard, { backgroundColor: colors.surface.raised }]}>
      <ImageBox uri={imageUrl} style={styles.photoImage} />
      <View style={{ gap: space.md }}>
        <Text style={[textStyle(mobileText.h5), { color: colors.text.heading }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={[textStyle(mobileText.label1), { color: colors.text.secondary }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

/** Callout card (Figma 410:7975): help panel with a link or a button. */
export function CalloutCard({ title, body, icon = 'message', linkLabel, buttonLabel, onPress }: CalloutCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.callout, { backgroundColor: colors.brandSubtle }]}>
      <View style={[styles.calloutIcon, { backgroundColor: colors.surface.raised }]}>
        <Icon name={icon} size={sizes.icon.xl} color={colors.text.brand} />
      </View>
      <View style={{ gap: space.md }}>
        <Text style={[textStyle(webText.h5), { color: colors.text.primary }]}>{title}</Text>
        <Text style={[textStyle(webText.body3), { color: colors.text.secondary }]}>{body}</Text>
        {linkLabel && (
          <Pressable onPress={onPress} accessibilityRole="link" style={styles.calloutLink}>
            <Icon name="message" size={sizes.icon.lg} color={colors.text.brand} />
            <Text style={[textStyle(mobileText.caption1), { color: colors.text.brand }]}>{linkLabel}</Text>
          </Pressable>
        )}
        {buttonLabel && <Button label={buttonLabel} variant="secondary" onPress={onPress} />}
      </View>
    </View>
  );
}

/** Insight card (Figma 175:5864): a dashboard number with a trend line. */
export function InsightCard({ title, value, insight, trend = 'up', onDismiss, forcePressed }: InsightCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.insight, { backgroundColor: colors.surface.muted }]}>
      <View style={styles.insightHeader}>
        <Text style={[textStyle(webText.h5), { color: colors.text.heading, flex: 1 }]}>{title}</Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10}>
            <Icon name="close" size={sizes.icon.lg} />
          </Pressable>
        )}
      </View>
      <Text
        style={[textStyle(componentText.insightNumber), { color: forcePressed ? colors.text.brand : colors.text.heading }]}
      >
        {value}
      </Text>
      {insight && (
        <Text style={[textStyle(webText.h5), { color: trend === 'up' ? colors.text.success : colors.text.error }]}>
          {insight}
        </Text>
      )}
    </View>
  );
}

/* ---------- Toast (Figma 2457:85043) ---------- */

export function Toast({ message, tone = 'success' }: ToastProps) {
  const { colors } = useTheme();
  const icon = tone === 'success' ? 'tick-circle' : tone === 'error' ? 'danger-circle' : 'info-circle';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: colors.toast.bg, boxShadow: boxShadow('toast') }]}
    >
      <Icon name={icon} size={sizes.icon.md} color={colors.toast[tone]} />
      <Text style={[textStyle(mobileText.label1), { color: colors.toast.text, flex: 1 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xxs,
    paddingHorizontal: space.xs,
    borderRadius: radii.lg,
  },
  badgeDot: { width: sizes.badgeDot, height: sizes.badgeDot, borderRadius: radii.pill },
  statusDot: { width: sizes.statusDot, height: sizes.statusDot, borderRadius: radii.pill },
  chip: { alignSelf: 'flex-start', paddingVertical: space.xxs, paddingHorizontal: space.xs, borderRadius: radii.xl },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radii.xl,
    borderWidth: sizes.border.hairline,
  },
  card: { borderRadius: radii.xl, gap: space.xs },
  drugCard: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl },
  drugDetails: { flex: 1, flexDirection: 'row', gap: space.md },
  drugImage: { width: 42, height: 68, borderRadius: radii.xl },
  drugContent: { flex: 1, gap: space.xs },
  medCard: { width: 164, height: 168, borderRadius: radii.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  medImage: StyleSheet.absoluteFill,
  medDetails: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  photoCard: { width: 234, gap: space.md, padding: space.md, borderRadius: radii.xl },
  photoImage: { height: 180, borderRadius: radii.xl },
  callout: { gap: 23, padding: space.md, borderRadius: radii.xl },
  calloutIcon: { width: 56, height: 56, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  calloutLink: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  insight: { gap: space.lg, padding: space.md, borderRadius: radii.xl },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
  },
});
