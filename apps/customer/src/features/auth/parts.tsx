/**
 * Building blocks shared by the customer Log in, Sign up, Verify phone and Forgot password
 * screens (Figma "Log in and sign up" section, 375 x 812 frames).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCountdown, PASSWORD_RESET_CHECK_LABELS, passwordChecks, type PasswordChecks } from '@medfind/core';
import { radii, sizes, space, mobileText } from '@medfind/ui';
import { Button, Icon, Text, Toast, textStyle, useTheme } from '@medfind/ui/native';
import type { ToastTone } from '@medfind/ui';

/** Page frame: safe area, scrolling body, footer pinned to the bottom. */
export function AuthScreen({
  children,
  footer,
  toast,
  topGap = space.lg,
}: {
  children: ReactNode;
  footer?: ReactNode;
  toast?: { message: string; tone: ToastTone } | null;
  /** Space above the first block (28px under the status bar in Figma, 16 when a back button leads). */
  topGap?: number;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topGap }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.body}>{children}</View>
          <View style={styles.flex} />
          {footer && <View style={styles.footer}>{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Toast message={toast.message} tone={toast.tone} />
        </View>
      )}
    </SafeAreaView>
  );
}

/** Toast that hides itself after 4 seconds. */
export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, (message: string, tone: ToastTone = 'error') => setToast({ message, tone })] as const;
}

export function AuthHeader({ title, subtitle, muted }: { title: string; subtitle?: ReactNode; muted?: boolean }) {
  return (
    <View style={styles.header}>
      <Text variant="h1" color={muted ? 'secondary' : 'primary'} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        typeof subtitle === 'string' ? (
          <Text variant="caption1" color="secondary">{subtitle}</Text>
        ) : (
          subtitle
        )
      ) : null}
    </View>
  );
}

export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={12} style={styles.back}>
      <Icon name="chevron-left" size={sizes.icon.lg} color={colors.text.brand} />
    </Pressable>
  );
}

/** Sign In / Sign Up switch. */
export function SegmentTabs({ active, onChange }: { active: 'sign_in' | 'sign_up'; onChange: (tab: 'sign_in' | 'sign_up') => void }) {
  const { colors } = useTheme();
  const tabs = [
    { key: 'sign_in' as const, label: 'Sign In' },
    { key: 'sign_up' as const, label: 'Sign Up' },
  ];
  return (
    <View style={[styles.segment, { backgroundColor: colors.segment.track }]} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => !on && onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segmentItem, on ? [styles.segmentActive, { backgroundColor: colors.segment.activeBg }] : styles.flex]}
          >
            <Text style={[textStyle(mobileText.button1), { color: on ? colors.segment.activeText : colors.segment.inactiveText }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "1 OF 2" with the two progress bars. */
export function StepBar({ step }: { step: 1 | 2 }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepBar} accessibilityLabel={`Step ${step} of 2`}>
      <Text variant="caption2" color="primary">{`${step} OF 2`}</Text>
      <View style={styles.bars}>
        {[1, 2].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.text.primary : colors.divider }]} />
        ))}
      </View>
    </View>
  );
}

/** Google and Apple buttons with the "OR CONTINUE WITH" divider. */
export function SocialSignIn({ onPress }: { onPress: (provider: 'Google' | 'Apple') => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.social}>
      <View style={styles.orRow}>
        <View style={[styles.orLine, { backgroundColor: colors.divider }]} />
        <Text variant="caption1" color="secondary">OR CONTINUE WITH</Text>
        <View style={[styles.orLine, { backgroundColor: colors.divider }]} />
      </View>
      <View style={styles.socialRow}>
        <View style={styles.flex}>
          <Button label="Google" variant="secondary" iconLeft="google" fullWidth onPress={() => onPress('Google')} />
        </View>
        <View style={styles.flex}>
          <Button label="Apple" variant="secondary" iconLeft="apple" fullWidth onPress={() => onPress('Apple')} />
        </View>
      </View>
    </View>
  );
}

export function socialComingSoon(provider: 'Google' | 'Apple'): string {
  return `Sign in with ${provider} is coming soon. Use your email for now.`;
}

/** "Don’t have an account yet?  Sign up" */
export function FooterPrompt({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.prompt}>
      <Text variant="caption1" color="secondary">{prompt}</Text>
      <Button label={action} variant="text" size="large" onPress={onPress} />
    </View>
  );
}

/** Green countdown pill next to "Resend code". */
export function TimerPill({ seconds }: { seconds: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.tone.success.bg }]}>
      <Text variant="caption1" style={{ color: colors.tone.success.text }}>{formatCountdown(seconds).replace(':', ': ')}</Text>
    </View>
  );
}

/** Counts down once a second to 0. Reset by changing `from` or calling restart. */
export function useCountdown(from: number) {
  const [left, setLeft] = useState(from);
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    setLeft(from);
  }, [from, epoch]);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setEpoch((e) => e + 1)] as const;
}

/** The three live checks under "Create a new password". */
export function PasswordCheckList({ password }: { password: string }) {
  const { colors } = useTheme();
  const checks = passwordChecks(password);
  return (
    <View style={[styles.checks, { backgroundColor: colors.surface.raised }]}>
      {(Object.keys(PASSWORD_RESET_CHECK_LABELS) as (keyof PasswordChecks)[]).map((k) => (
        <View key={k} style={styles.checkRow} accessibilityLabel={`${PASSWORD_RESET_CHECK_LABELS[k]}: ${checks[k] ? 'done' : 'not yet'}`}>
          <Icon name="tick-circle" size={sizes.icon.sm} color={checks[k] ? colors.text.success : colors.text.secondary} />
          <Text variant="caption1" color={checks[k] ? 'heading' : 'secondary'}>{PASSWORD_RESET_CHECK_LABELS[k]}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Grey underlined link ("Resend code", "Send code to email instead"). Brand blue when it is
 * the thing to tap next, grey (still 4.5:1) while it waits.
 */
export function UnderlineLink({ label, onPress, disabled, emphasis }: { label: string; onPress: () => void; disabled?: boolean; emphasis?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} hitSlop={8}>
      <Text variant="label1" style={{ color: emphasis ? colors.text.brand : colors.text.secondary, textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Error line under the code boxes. */
export function CodeError({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.codeError} accessibilityRole="alert">
      <Icon name="danger-circle" size={sizes.icon.sm} color={colors.input.helperError} />
      <Text variant="caption1" style={{ color: colors.input.helperError, flex: 1 }}>{message}</Text>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  fields: { gap: space.md },
  right: { flexDirection: 'row', justifyContent: 'flex-end' },
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  bottom: { gap: space.md, paddingBottom: space.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: space.md },
  body: { gap: space.lg },
  footer: { paddingTop: space.lg },
  toast: { position: 'absolute', top: space.xxl + space.lg, left: space.md, right: space.md },
  header: { gap: space.xs },
  back: { alignSelf: 'flex-start', paddingVertical: space.xxs },
  segment: { flexDirection: 'row', borderRadius: radii.lg, height: 48 },
  segmentItem: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.xl },
  segmentActive: { paddingHorizontal: space.lg + space.sm },
  stepBar: { gap: space.xs },
  bars: { flexDirection: 'row', gap: space.sm },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  social: { gap: space.lg },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  orLine: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: space.md },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md, paddingBottom: space.md },
  pill: { borderRadius: radii.pill, paddingHorizontal: space.xs, paddingVertical: 2 },
  checks: { borderRadius: radii.xl, padding: space.md, gap: space.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  codeError: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
