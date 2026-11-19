import { ActivityIndicator, Pressable, View, StyleSheet, type PressableStateCallbackType } from 'react-native';
import { buttonColors, isOutlined } from '../buttonColors.ts';
import { sizes, radii, space } from '../tokens/layout.ts';
import { mobileText } from '../tokens/typography.ts';
import type { ButtonProps, InteractionState } from '../types.ts';
import { Icon } from './Icon.tsx';
import { Text, textStyle } from './Text.tsx';
import { useTheme } from './ThemeProvider.tsx';

const labelToken = { large: mobileText.button1, medium: mobileText.button2, small: mobileText.button3 } as const;

export function Button({
  label,
  variant = 'primary',
  size = 'large',
  icon,
  iconLeft,
  disabled,
  loading,
  fullWidth,
  onPress,
  accessibilityLabel,
  forceState,
}: ButtonProps) {
  const { colors } = useTheme();
  const dims = sizes.button[size];
  const iconOnly = !label && !!(icon || iconLeft);
  const isText = variant === 'text';
  const inactive = disabled || loading;

  const stateFor = ({ pressed, hovered }: PressableStateCallbackType & { hovered?: boolean }): InteractionState =>
    forceState ?? (disabled ? 'disabled' : pressed ? 'pressed' : hovered ? 'hover' : 'default');

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={(s) => {
        const c = buttonColors(colors, variant, stateFor(s));
        const pad = isText ? 0 : iconOnly ? (dims.iconOnly - dims.iconOnlyIcon) / 2 : undefined;
        return [
          styles.base,
          {
            backgroundColor: c.background,
            borderColor: c.border,
            borderWidth: isOutlined(variant) ? sizes.border.hairline : 0,
            borderRadius: radii.xl,
            paddingVertical: pad ?? dims.paddingY,
            paddingHorizontal: pad ?? dims.paddingX,
          },
          iconOnly && !isText && { width: dims.iconOnly, height: dims.iconOnly, borderRadius: dims.iconOnly / 2 },
          fullWidth && styles.fullWidth,
        ];
      }}
    >
      {(s) => {
        const c = buttonColors(colors, variant, stateFor(s as PressableStateCallbackType));
        const iconSize = iconOnly ? dims.iconOnlyIcon : dims.icon;
        return (
          <>
            {loading && (
              <View style={[StyleSheet.absoluteFill, styles.spinner]}>
                <ActivityIndicator size="small" color={c.text} />
              </View>
            )}
            <View style={[styles.content, loading && styles.hidden]}>
            {iconLeft && <Icon name={iconLeft} size={iconSize} color={c.text} />}
            {label && (
              <Text style={[textStyle(labelToken[size]), { color: c.text }]} numberOfLines={1}>
                {label}
              </Text>
            )}
            {icon && <Icon name={icon} size={iconSize} color={c.text} />}
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  hidden: { opacity: 0 },
  spinner: { alignItems: 'center', justifyContent: 'center' },
});
