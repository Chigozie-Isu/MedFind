import { Image, Pressable, StyleSheet, View } from 'react-native';
import { radii, sizes, space } from '../tokens/layout.ts';
import { mobileText, webText } from '../tokens/typography.ts';
import type {
  CheckboxProps,
  ChecklistItemProps,
  ListRowProps,
  OptionListProps,
  OptionRowProps,
  RadioProps,
  ToggleProps,
} from '../types.ts';
import { Button } from './Button.tsx';
import { Icon } from './Icon.tsx';
import { Text, textStyle } from './Text.tsx';
import { useTheme } from './ThemeProvider.tsx';

/** Radio (Figma 505:16205): 1.5px ring when off, 2px ring and 10px dot when on. */
export function Radio({ selected, disabled }: RadioProps) {
  const { colors } = useTheme();
  const color = disabled ? colors.text.disabled : selected ? colors.control.on : colors.control.off;
  return (
    <View style={styles.radioBox}>
      <View
        style={[
          styles.radioRing,
          selected ? { borderWidth: 2, width: 18, height: 18 } : { borderWidth: 1.5, width: 19, height: 19 },
          { borderColor: color },
        ]}
      >
        {selected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
      </View>
    </View>
  );
}

/** Check box (Figma checklist 456:14308): 24px, 8px radius. */
export function Checkbox({ checked, onChange, disabled, accessibilityLabel }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={[
        styles.checkbox,
        checked
          ? { backgroundColor: colors.control.on, borderColor: colors.control.on }
          : { borderColor: colors.control.on },
        disabled && { opacity: 0.4 },
      ]}
    >
      {checked && <Icon name="tick" size={sizes.icon.sm} color={colors.text.onBrand} />}
    </Pressable>
  );
}

/** Option row (Figma 505:16232), e.g. payment methods. */
export function OptionRow({ title, description, icon, selected, onPress, actionLabel, onAction }: OptionRowProps) {
  const { colors } = useTheme();
  const descColor = selected ? colors.control.optionSelectedText : colors.text.secondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.surface.selected : colors.surface.raised,
          borderColor: selected ? colors.control.optionBorderSelected : colors.control.optionBorder,
        },
      ]}
    >
      <Radio selected={selected} />
      <View style={styles.optionContent}>
        <View style={styles.optionTitle}>
          {icon && <Icon name={icon} size={sizes.icon.sm} />}
          <Text style={[textStyle(mobileText.h5), { color: colors.text.primary }]}>{title}</Text>
        </View>
        {description && <Text style={[textStyle(mobileText.body3), { color: descColor }]}>{description}</Text>}
      </View>
      {actionLabel && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text
            style={[
              textStyle(mobileText.h5),
              { color: selected ? colors.control.optionSelectedAction : colors.text.brand },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

/** A single-choice list of option rows. */
export function OptionList({ options, value, onChange }: OptionListProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.stack}>
      {options.map(({ value: v, ...o }) => (
        <OptionRow key={v} {...o} selected={v === value} onPress={() => onChange?.(v)} />
      ))}
    </View>
  );
}

/** Checklist row (Figma 456:14308), e.g. the pharmacist's prescription checks. */
export function ChecklistItem({ title, subtitle, checked, onChange }: ChecklistItemProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      style={[styles.checklist, { backgroundColor: colors.surface.raised }]}
    >
      <Checkbox checked={checked} onChange={onChange} accessibilityLabel={title} />
      <View style={styles.checklistContent}>
        <Text style={[textStyle(webText.h5), { color: colors.text.primary }]}>{title}</Text>
        {subtitle && <Text style={[textStyle(mobileText.label1), { color: colors.text.body }]}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

/** List row (Figma 535:18772): thumbnail, text and a small button. */
export function ListRow({ title, subtitle, meta, imageUrl, actionLabel, onAction, onPress, forcePressed }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        { backgroundColor: pressed || forcePressed ? colors.surface.pressed : colors.surface.raised },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.surface.muted }]}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.thumb} />}
      </View>
      <View style={styles.listContent}>
        <View style={{ gap: space.xs }}>
          <Text style={[textStyle(mobileText.h5), { color: colors.text.primary }]}>{title}</Text>
          {subtitle && <Text style={[textStyle(mobileText.caption1), { color: colors.text.secondary }]}>{subtitle}</Text>}
        </View>
        {(meta || actionLabel) && (
          <View style={styles.listFooter}>
            {meta && <Text style={[textStyle(mobileText.caption1), { color: colors.text.secondary, flex: 1 }]}>{meta}</Text>}
            {actionLabel && <Button label={actionLabel} size="small" iconLeft="add" onPress={onAction} />}
          </View>
        )}
      </View>
    </Pressable>
  );
}

/** Toggle (Figma Toggle/On, Toggle/Off): 44x22 track. */
export function Toggle({ value, onChange, disabled, accessibilityLabel }: ToggleProps) {
  const { colors } = useTheme();
  const t = sizes.toggle;
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[
        styles.track,
        { width: t.width, height: t.height, backgroundColor: value ? colors.control.toggleOn : colors.control.toggleOff },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View
        style={[
          styles.knob,
          { width: t.knob, height: t.knob, backgroundColor: colors.control.toggleKnob, left: value ? 22 : 2.75 },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  radioBox: { width: sizes.radio, height: sizes.radio, alignItems: 'center', justifyContent: 'center' },
  radioRing: { borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: radii.pill },
  checkbox: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radii.sm,
    borderWidth: sizes.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.md,
    borderRadius: radii.xl,
    borderWidth: sizes.border.hairline,
  },
  optionContent: { flex: 1, gap: space.xs },
  optionTitle: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  checklist: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, padding: space.md, borderRadius: radii.xl },
  checklistContent: { flex: 1, gap: space.md },
  listRow: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl },
  thumb: { width: 42, height: 42, borderRadius: radii.lg, overflow: 'hidden' },
  listContent: { flex: 1, gap: space.xs },
  listFooter: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  track: { borderRadius: radii.pill, justifyContent: 'center' },
  knob: { position: 'absolute', borderRadius: radii.pill },
});
