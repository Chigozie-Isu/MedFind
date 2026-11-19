import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { radii, sizes, space } from '../tokens/layout.ts';
import { componentText, mobileText, webText } from '../tokens/typography.ts';
import type { CodeInputProps, FieldState, SearchFieldProps, TextFieldProps } from '../types.ts';
import { Icon } from './Icon.tsx';
import { Text, textStyle } from './Text.tsx';
import { useTheme } from './ThemeProvider.tsx';

/** Hex colour plus alpha, e.g. withAlpha('#4B5A67', 0.4). */
export function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

const nativeAutoComplete = {
  email: 'email',
  username: 'username',
  'current-password': 'current-password',
  'new-password': 'new-password',
  tel: 'tel',
  'one-time-code': 'one-time-code',
  name: 'name',
  off: 'off',
} as const;

const keyboardType = { default: 'default', email: 'email-address', phone: 'phone-pad', number: 'number-pad' } as const;

/** Input field (Figma 199:4251): label, 16px-radius box, helper or error text. */
export function TextField({
  label,
  required,
  info,
  placeholder,
  value,
  onChangeText,
  helperText,
  errorText,
  disabled,
  secure,
  size = 'mobile',
  keyboard = 'default',
  autoComplete,
  onSubmitEditing,
  forceState,
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const state: FieldState =
    forceState ?? (disabled ? 'disabled' : errorText ? 'error' : focused ? 'focus' : value ? 'filled' : 'default');
  const border = {
    default: colors.input.border,
    focus: colors.input.borderFocus,
    filled: colors.input.borderFilled,
    error: colors.input.borderError,
    disabled: colors.input.borderDisabled,
  }[state];
  const helper = state === 'error' ? errorText ?? helperText : helperText;
  const textToken = mobileText.caption1;

  return (
    <View style={styles.field}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[textStyle(mobileText.label1), { color: colors.input.label }]}>
            {label}
            {required && <Text style={[textStyle(mobileText.body2), { color: colors.text.required }]}> *</Text>}
          </Text>
          {info && <Icon name="info-circle" size={sizes.icon.xs} color={colors.text.brand} />}
        </View>
      )}
      <View
        style={[
          styles.box,
          {
            borderColor: withAlpha(border, colors.input.borderOpacity),
            backgroundColor: colors.input.background,
            paddingVertical: size === 'web' ? space.md : space.xs,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.input.placeholder}
          editable={!disabled}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType[keyboard]}
          autoComplete={autoComplete ? nativeAutoComplete[autoComplete] : undefined}
          autoCapitalize={keyboard === 'email' || secure || autoComplete === 'username' ? 'none' : undefined}
          autoCorrect={keyboard === 'email' || secure ? false : undefined}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[
            styles.input,
            textStyle(textToken),
            { color: disabled ? colors.text.disabled : colors.input.value, minHeight: textToken.lineHeight },
          ]}
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={12}
          >
            <Icon name={revealed ? 'hide' : 'show'} size={sizes.icon.sm} color={colors.text.secondary} />
          </Pressable>
        )}
      </View>
      {helper && (
        <View style={styles.helperRow}>
          <Icon
            name={state === 'error' ? 'danger-triangle' : 'info-circle'}
            size={sizes.icon.xs}
            color={state === 'error' ? colors.input.helperError : colors.input.helper}
          />
          <Text
            style={[
              textStyle(mobileText.caption2),
              { color: state === 'error' ? colors.input.helperError : colors.input.helper },
            ]}
          >
            {helper}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Search (Figma 195:3096): 42px box with the search icon on the right. */
export function SearchField({ placeholder = 'Search', value, onChangeText, size = 'mobile', forceState }: SearchFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const state = forceState ?? (focused ? 'focus' : value ? 'filled' : 'default');
  const border = { default: colors.search.border, focus: colors.search.borderFocus, filled: colors.search.borderFilled }[state];
  const token = size === 'web' ? webText.body3 : mobileText.caption1;
  return (
    <View style={[styles.search, { borderColor: border }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        style={[styles.input, textStyle(token), { color: colors.input.value }]}
      />
      <Icon name="search" size={sizes.icon.lg} color={colors.icon.default} />
    </View>
  );
}

/** Number input (Figma 277:6284): one box per digit, grouped with a dash. */
export function CodeInput({
  length = 6,
  groupSize = 3,
  value = '',
  onChangeText,
  error,
  secure,
  accessibilityLabel = 'Code',
}: CodeInputProps) {
  const { colors } = useTheme();
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');
  const border = error ? colors.input.borderError : colors.input.border;
  const boxes = Array.from({ length }, (_, i) => i);
  const groups: number[][] = [];
  const g = groupSize > 0 ? groupSize : length;
  for (let i = 0; i < length; i += g) groups.push(boxes.slice(i, i + g));

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={accessibilityLabel} style={styles.codeRow}>
      {groups.map((group, gi) => (
        <View key={gi} style={styles.codeRow}>
          {gi > 0 && (
            <Text style={[textStyle(componentText.codeSeparator), { color: colors.text.heading }]}>-</Text>
          )}
          <View style={styles.codeGroup}>
            {group.map((i) => (
              <View key={i} style={[styles.codeBox, { borderColor: border }]}>
                <Text
                  style={[
                    textStyle(componentText.codeDigit),
                    { color: digits[i] ? colors.text.heading : colors.text.tertiary },
                  ]}
                >
                  {digits[i] ? (secure ? '•' : digits[i]) : '0'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <TextInput
        ref={ref}
        value={digits.join('')}
        onChangeText={(t) => onChangeText?.(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        accessibilityLabel={accessibilityLabel}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs, alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: sizes.border.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, padding: 0, margin: 0 },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 42,
    borderWidth: sizes.border.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    alignSelf: 'stretch',
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  codeGroup: { flexDirection: 'row', gap: space.md },
  codeBox: {
    width: sizes.codeBox.width,
    height: sizes.codeBox.height,
    borderWidth: sizes.border.strong,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
