/**
 * Layout pieces shared by the customer demo screens: screen header with back chevron
 * and step bar, bottom sheet, toast, skeletons, empty state, info rows and so on.
 * Colours, text styles, spacing and radii all come from @medfind/ui.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { boxShadow, radii, sizes, space, type IconName, type ToastTone } from '@medfind/ui';
import { Button, Icon, Text, Toast, useTheme } from '@medfind/ui/native';
import { medicineImages } from './data';
import { ExtraIcon, type ExtraIconName } from './icons';
import { TabScreen } from './parts';
import type { CustomerTab } from '@medfind/ui';

export const mascots = {
  cancelled: require('../../../assets/demo/mascot-cancelled.png') as ImageSourcePropType,
  declined: require('../../../assets/demo/mascot-declined.png') as ImageSourcePropType,
  expired: require('../../../assets/demo/mascot-expired.png') as ImageSourcePropType,
  empty: require('../../../assets/demo/mascot-empty.png') as ImageSourcePropType,
};
export const avatarGrace = require('../../../assets/demo/avatar-grace.png') as ImageSourcePropType;

/** Goes back, or to `fallback` when there is no history (e.g. a reloaded web page). */
export function goBack(fallback: string = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as never);
}

/** "1 OF 2" with the segmented progress bar, as on the Reserve and Payment screens. */
function StepBar({ n, of }: { n: number; of: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.steps}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={[styles.stepSeg, { backgroundColor: i < n ? colors.text.primary : colors.surface.border }]} />
      ))}
    </View>
  );
}

export interface ScreenProps {
  title?: string;
  /** Back chevron. `false` hides it. Default goes back. */
  onBack?: (() => void) | false;
  /** Close (X) on the right instead of a back chevron, as on result screens. */
  onClose?: () => void;
  right?: ReactNode;
  step?: { n: number; of: number };
  footer?: ReactNode;
  children?: ReactNode;
  scroll?: boolean;
  /** Show the customer tab bar. */
  tab?: CustomerTab;
  overlay?: ReactNode;
  /** Large page title (H1) under the header row instead of an H2 next to the chevron. */
  bigTitle?: boolean;
}

export function Screen({ title, onBack, onClose, right, step, footer, children, scroll = true, tab, overlay, bigTitle }: ScreenProps) {
  const { colors } = useTheme();
  const showBack = onBack !== false && !bigTitle;
  const header = (
    <View>
      <View style={styles.header}>
        {showBack && (
          <Pressable
            onPress={onBack || (() => goBack())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={space.sm}
          >
            <Icon name="chevron-left" size={sizes.icon.lg} color={colors.text.brand} />
          </Pressable>
        )}
        {title && !bigTitle ? (
          <Text variant="h2" style={styles.flex} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {step && (
          <Text variant="caption1" color="secondary">
            {step.n} OF {step.of}
          </Text>
        )}
        {right}
        {onClose && (
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={space.sm}>
            <Icon name="close" size={sizes.icon.lg} color={colors.text.heading} />
          </Pressable>
        )}
      </View>
      {step && <StepBar {...step} />}
      {bigTitle && title && (
        <Text variant="h1" style={styles.bigTitle} accessibilityRole="header">
          {title}
        </Text>
      )}
    </View>
  );
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content]}>{children}</View>
  );
  const inner = (
    <>
      {header}
      <View style={styles.flex}>{body}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
      {overlay}
    </>
  );
  if (tab) return <TabScreen tab={tab}>{inner}</TabScreen>;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.surface.default }]} edges={['top', 'bottom']}>
      {inner}
    </SafeAreaView>
  );
}

/** Bottom sheet over a dimmed screen (Figma overlays). Tapping outside closes it. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.dim]} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.surface.default }]}>
        <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
        <SafeAreaView edges={['bottom']} style={styles.sheetBody}>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/** Confirm sheet: title, body, a main action and Cancel / Go back. */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="h2">{title}</Text>
      <Text variant="body3" color="secondary">
        {body}
      </Text>
      <View style={styles.gapSm}>
        <Button label={confirmLabel} variant={destructive ? 'destructive-primary' : 'primary'} fullWidth onPress={onConfirm} />
        <Button label={cancelLabel} variant="secondary" fullWidth onPress={onClose} />
      </View>
    </Sheet>
  );
}

/** A short toast at the top of the screen. */
export function useFlash(): [ReactNode, (message: string, tone?: ToastTone) => void] {
  const [msg, setMsg] = useState<{ text: string; tone: ToastTone } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <View style={styles.toast} pointerEvents="none">
      <Toast message={msg.text} tone={msg.tone} />
    </View>
  ) : null;
  return [node, (text, tone = 'success') => setMsg({ text, tone })];
}

/** True for `ms` after mount: drives the Figma "– loading" skeletons. */
export function useBriefLoading(ms = 700): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/** Grey pulsing block for loading states. */
export function Skeleton({ height = 16, width = '100%', radius = radii.sm }: { height?: number; width?: number | `${number}%`; radius?: number }) {
  const { colors } = useTheme();
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0.5, duration: 600, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={{ height, width, borderRadius: radius, backgroundColor: colors.surface.pressed, opacity: v }} />;
}

/** A card-shaped skeleton like the list rows. */
export function SkeletonRow() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skRow, { backgroundColor: colors.surface.raised }]} accessibilityLabel="Loading">
      <Skeleton width={42} height={42} radius={radii.lg} />
      <View style={[styles.flex, styles.gapXs]}>
        <Skeleton width="60%" />
        <Skeleton width="40%" height={12} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
}

export function EmptyState({
  image = mascots.empty,
  title,
  body,
  action,
  onAction,
}: {
  image?: ImageSourcePropType;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Image source={image} style={styles.emptyImage} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text variant="h3" style={styles.center}>
        {title}
      </Text>
      <Text variant="body3" color="secondary" style={styles.center}>
        {body}
      </Text>
      {action && <Button label={action} onPress={onAction} />}
    </View>
  );
}

/** Medicine photo (from Figma) or a box icon. */
export function MedThumb({ medicineId, size = 42 }: { medicineId?: string; size?: number }) {
  const { colors } = useTheme();
  const src = medicineId ? medicineImages[medicineId] : undefined;
  return (
    <View style={[styles.thumb, { width: size, height: size, backgroundColor: colors.surface.muted }]}>
      {src ? (
        <Image source={src} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : (
        <Icon name="box" size={size > 60 ? sizes.icon.xl : sizes.icon.lg} color={colors.text.secondary} />
      )}
    </View>
  );
}

/** Card with label / value rows split by dividers (receipts, summaries). */
export function InfoRows({ rows }: { rows: Array<{ label: string; value: string; tone?: 'warning' | 'success' | 'error' }> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.surface.border }]}>
          <Text variant="label2" color="secondary">
            {r.label}
          </Text>
          <Text
            variant="label1"
            color="heading"
            style={[styles.infoValue, r.tone && { color: colors.tone[r.tone].outlineText }]}
          >
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Small icon + caption note (e.g. the shield notes under pickup codes). */
export function Note({ children, icon = 'shield', tone }: { children: ReactNode; icon?: IconName; tone?: 'success' | 'warning' | 'info' }) {
  const { colors } = useTheme();
  const t = tone ? colors.tone[tone] : null;
  return (
    <View style={[styles.note, t && { backgroundColor: t.bg, padding: space.sm, borderRadius: radii.lg }]}>
      <Icon name={icon} size={sizes.icon.md} color={t ? t.text : colors.text.secondary} />
      <Text variant="caption1" style={[styles.flex, { color: t ? t.text : colors.text.secondary }]}>
        {children}
      </Text>
    </View>
  );
}

/** Settings-style row: round icon, title, subtitle, chevron. */
export function LinkRow({
  icon,
  extraIcon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  extraIcon?: ExtraIconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.linkRow, { backgroundColor: pressed ? colors.surface.pressed : colors.surface.raised }]}
    >
      {(icon || extraIcon) && (
        <View style={[styles.bubble, { backgroundColor: colors.brandSubtle }]}>
          {icon ? (
            <Icon name={icon} size={sizes.icon.md} color={colors.text.brand} />
          ) : (
            <ExtraIcon name={extraIcon!} size={sizes.icon.md} color={colors.text.brand} />
          )}
        </View>
      )}
      <View style={[styles.flex, styles.gapXxs]}>
        <Text variant="h5">{title}</Text>
        {subtitle && (
          <Text variant="caption1" color="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress && <Icon name="chevron-right" size={sizes.icon.lg} color={colors.icon.default} />)}
    </Pressable>
  );
}

/** Outlined pill used for reasons, quick amounts and filters. */
export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.pill,
        { borderColor: selected ? colors.brand.default : colors.text.body, backgroundColor: selected ? colors.brandSubtle : 'transparent' },
      ]}
    >
      <Text variant="label2" style={{ color: selected ? colors.text.brand : colors.text.body }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="h4" style={styles.flex}>
        {children}
      </Text>
      {action && <Button label={action} variant="inline" size="medium" icon="chevron-right" onPress={onAction} />}
    </View>
  );
}

/** Round icon badge on success / failure screens. */
export function ResultBadge({ tone = 'success', icon }: { tone?: 'success' | 'error' | 'info'; icon?: IconName }) {
  const { colors } = useTheme();
  const t = colors.tone[tone];
  return (
    <View style={[styles.result, { backgroundColor: t.bg }]}>
      <Icon name={icon ?? (tone === 'error' ? 'danger-circle' : tone === 'info' ? 'time-circle' : 'tick-circle')} size={36} color={t.text} />
    </View>
  );
}

export function Stars({ value, onChange, size = 40 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} hitSlop={4}>
          <ExtraIcon name="star" size={size} filled color={n <= value ? colors.tone.warning.dot : colors.text.tertiary} />
        </Pressable>
      ))}
    </View>
  );
}

export const kit = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  gap: { gap: space.md },
  gapSm: { gap: space.sm },
  card: { padding: space.md, borderRadius: radii.xl, gap: space.sm },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  gapXxs: { gap: space.xxs },
  gapXs: { gap: space.xs },
  gapSm: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xs },
  bigTitle: { paddingHorizontal: space.md },
  steps: { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.md, paddingBottom: space.xs },
  stepSeg: { flex: 1, height: 3, borderRadius: radii.pill },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  footer: { paddingHorizontal: space.md, paddingTop: space.xs, paddingBottom: space.md, gap: space.xs },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 9, 20, 0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, marginTop: space.sm, opacity: 0.6 },
  sheetBody: { padding: space.md, gap: space.md },
  toast: { position: 'absolute', left: space.md, right: space.md, top: space.xxl, zIndex: 10 },
  skRow: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl, paddingHorizontal: space.md },
  emptyImage: { width: 210, height: 156 },
  thumb: { borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  card: { borderRadius: radii.xl, paddingHorizontal: space.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  bubble: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  pill: { borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: space.sm, paddingVertical: space.xxs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center' },
  result: { width: 72, height: 72, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: space.xs },
});
