'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { formatNaira } from '@medfind/core';
import { icons, strokeWidthFor, type IconName } from '../icons/icons.ts';
import { sizes } from '../tokens/layout.ts';
import type {
  BadgeProps,
  ButtonProps,
  CalloutCardProps,
  CardProps,
  CheckboxProps,
  ChecklistItemProps,
  CodeInputProps,
  DrugCardProps,
  FieldState,
  FilterChipProps,
  InsightCardProps,
  ListRowProps,
  MedicationCardProps,
  OptionListProps,
  OptionRowProps,
  PhotoCardProps,
  RadioProps,
  SearchFieldProps,
  StatusDotProps,
  TagProps,
  ToastProps,
  ToggleProps,
} from '../types.ts';

/*
 * Web versions of the shared components for the pharmacy app. Same props as
 * the native versions in `@medfind/ui/native`. Styling comes from the CSS
 * returned by `themeCss()`, which the app loads once in its root layout.
 */

export interface IconProps {
  name: IconName;
  size?: number;
  /** Defaults to currentColor. */
  color?: string;
  accessibilityLabel?: string;
}

export function Icon({ name, size = 24, color = 'currentColor', accessibilityLabel }: IconProps) {
  const def = icons[name];
  const sw = strokeWidthFor(def, size);
  return (
    <svg
      className="mf-icon"
      width={size}
      height={size}
      viewBox={`0 0 ${def.box} ${def.box}`}
      fill="none"
      role={accessibilityLabel ? 'img' : undefined}
      aria-label={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
    >
      {def.paths.map((p, i) =>
        p.kind === 'stroke' ? (
          <path
            key={i}
            d={p.d}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin={p.roundJoin ? 'round' : 'miter'}
          />
        ) : (
          <path key={i} d={p.d} fill={color} />
        ),
      )}
    </svg>
  );
}

export type TextVariantName =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
  | 'body1' | 'body2' | 'body3'
  | 'button1' | 'button2' | 'button3'
  | 'label1' | 'label2' | 'caption1' | 'caption2';

export function Text({
  variant = 'body2',
  as: Tag = 'span',
  color,
  children,
  className,
}: {
  variant?: TextVariantName;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'div' | 'label';
  /** A CSS colour, e.g. `var(--mf-text-secondary)`. */
  color?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Tag className={`mf-t-${variant}${className ? ` ${className}` : ''}`} style={{ margin: 0, color }}>
      {children}
    </Tag>
  );
}

/* ---------- Buttons (Figma 43:16130) ---------- */

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
  const dims = sizes.button[size];
  const iconOnly = !label && !!(icon || iconLeft);
  const iconSize = iconOnly ? dims.iconOnlyIcon : dims.icon;
  return (
    <button
      type="button"
      className="mf-btn mf-focusable"
      data-variant={variant}
      data-size={size}
      data-state={forceState && forceState !== 'default' ? forceState : undefined}
      data-icon-only={iconOnly && variant !== 'text' ? '' : undefined}
      data-full-width={fullWidth ? '' : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={accessibilityLabel ?? (iconOnly ? label : undefined)}
      onClick={onPress}
    >
      {loading && <span className="mf-spinner" aria-hidden />}
      <span className="mf-btn-content" data-hidden={loading ? '' : undefined}>
        {iconLeft && <Icon name={iconLeft} size={iconSize} />}
        {label}
        {icon && <Icon name={icon} size={iconSize} />}
      </span>
    </button>
  );
}

/* ---------- Inputs (Figma section 225:2638) ---------- */

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
  forceState,
}: import('../types.ts').TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const state: FieldState | undefined =
    forceState ?? (disabled ? 'disabled' : errorText ? 'error' : value ? 'filled' : undefined);
  const helper = state === 'error' ? errorText ?? helperText : helperText;
  const type = secure && !revealed ? 'password' : keyboard === 'email' ? 'email' : keyboard === 'phone' ? 'tel' : 'text';
  return (
    <div className="mf-field">
      {label && (
        <label htmlFor={id} className="mf-field-label mf-t-label1">
          <span>
            {label}
            {required && <span className="mf-field-required"> *</span>}
          </span>
          {info && <Icon name="info-circle" size={sizes.icon.xs} color="var(--mf-text-brand)" />}
        </label>
      )}
      <div className="mf-field-box" data-size={size} data-state={state}>
        <input
          id={id}
          className="mf-input"
          type={type}
          inputMode={keyboard === 'number' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeText?.(e.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={helper ? `${id}-help` : undefined}
        />
        {secure && (
          <button
            type="button"
            className="mf-icon-btn mf-focusable"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            style={{ color: 'var(--mf-text-secondary)' }}
          >
            <Icon name={revealed ? 'hide' : 'show'} size={sizes.icon.sm} />
          </button>
        )}
      </div>
      {helper && (
        <div id={`${id}-help`} className="mf-field-helper mf-t-caption2" data-error={state === 'error' ? '' : undefined}>
          <Icon name={state === 'error' ? 'danger-triangle' : 'info-circle'} size={sizes.icon.xs} />
          {helper}
        </div>
      )}
    </div>
  );
}

export function SearchField({ placeholder = 'Search', value, onChangeText, forceState }: SearchFieldProps) {
  const state = forceState ?? (value ? 'filled' : undefined);
  return (
    <label className="mf-search" data-state={state}>
      <input
        className="mf-input"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
      />
      <Icon name="search" size={sizes.icon.lg} />
    </label>
  );
}

export function CodeInput({
  length = 6,
  groupSize = 3,
  value = '',
  onChangeText,
  error,
  secure,
  accessibilityLabel = 'Code',
}: CodeInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');
  const g = groupSize > 0 ? groupSize : length;
  const groups: number[][] = [];
  for (let i = 0; i < length; i += g) groups.push(Array.from({ length: Math.min(g, length - i) }, (_, k) => i + k));
  return (
    <div className="mf-code" data-error={error ? '' : undefined} onClick={() => ref.current?.focus()}>
      {groups.map((group, gi) => (
        <span key={gi} className="mf-code" style={{ cursor: 'inherit' }}>
          {gi > 0 && <span className="mf-code-sep" aria-hidden>-</span>}
          <span className="mf-code-group">
            {group.map((i) => (
              <span
                key={i}
                className="mf-code-box"
                data-empty={digits[i] ? undefined : ''}
                data-current={i === digits.length ? '' : undefined}
                aria-hidden
              >
                {digits[i] ? (secure ? '•' : digits[i]) : '0'}
              </span>
            ))}
          </span>
        </span>
      ))}
      <input
        ref={ref}
        className="mf-code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={digits.join('')}
        aria-label={accessibilityLabel}
        aria-invalid={error || undefined}
        onChange={(e) => onChangeText?.(e.target.value.replace(/\D/g, '').slice(0, length))}
      />
    </div>
  );
}

/* ---------- Selection (Figma 505:16232, 505:16205, 456:14308, 535:18772) ---------- */

export function Radio({ selected }: RadioProps) {
  return <span className="mf-radio" data-selected={selected ? '' : undefined} aria-hidden />;
}

export function Checkbox({ checked, onChange, disabled, accessibilityLabel }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      className="mf-checkbox mf-focusable"
      aria-checked={!!checked}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
    >
      {checked && <Icon name="tick" size={sizes.icon.sm} />}
    </button>
  );
}

export function OptionRow({ title, description, icon, selected, onPress, actionLabel, onAction }: OptionRowProps) {
  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={!!selected}
      className="mf-option mf-focusable"
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onPress?.();
        }
      }}
    >
      <Radio selected={selected} />
      <span className="mf-option-content">
        <span className="mf-option-title mf-tm-h5">
          {icon && <Icon name={icon} size={sizes.icon.sm} />}
          {title}
        </span>
        {description && <span className="mf-option-desc mf-t-body3">{description}</span>}
      </span>
      {actionLabel && (
        <button
          type="button"
          className="mf-option-action mf-t-button1 mf-focusable"
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function OptionList({ options, value, onChange }: OptionListProps) {
  return (
    <div role="radiogroup" className="mf-stack">
      {options.map(({ value: v, ...o }) => (
        <OptionRow key={v} {...o} selected={v === value} onPress={() => onChange?.(v)} />
      ))}
    </div>
  );
}

export function ChecklistItem({ title, subtitle, checked, onChange }: ChecklistItemProps) {
  return (
    <div className="mf-checklist" onClick={() => onChange?.(!checked)}>
      <Checkbox checked={checked} onChange={onChange} accessibilityLabel={title} />
      <div className="mf-checklist-content">
        <Text variant="h5" color="var(--mf-text-primary)">{title}</Text>
        {subtitle && <Text variant="label1" color="var(--mf-text-body)">{subtitle}</Text>}
      </div>
    </div>
  );
}

export function ListRow({ title, subtitle, meta, imageUrl, actionLabel, onAction, onPress, forcePressed }: ListRowProps) {
  return (
    <div className="mf-list-row" data-pressed={forcePressed ? '' : undefined} onClick={onPress}>
      {imageUrl ? <img className="mf-thumb" src={imageUrl} alt="" /> : <span className="mf-thumb" />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="mf-tm-h5" style={{ color: 'var(--mf-text-primary)' }}>{title}</span>
        {subtitle && <Text variant="caption1" color="var(--mf-text-secondary)">{subtitle}</Text>}
        {(meta || actionLabel) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {meta && <span className="mf-t-caption1" style={{ flex: 1, color: 'var(--mf-text-secondary)' }}>{meta}</span>}
            {actionLabel && <Button label={actionLabel} size="small" iconLeft="add" onPress={onAction} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function Toggle({ value, onChange, disabled, accessibilityLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      className="mf-toggle mf-focusable"
      aria-checked={value}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={() => onChange?.(!value)}
    />
  );
}

/* ---------- Badges, status, chips, tags (Figma section 327:6702) ---------- */

export function Badge({ label, tone = 'neutral', appearance = 'filled', dot = 'none' }: BadgeProps) {
  return (
    <span className="mf-badge" data-tone={tone} data-appearance={appearance}>
      {dot === 'left' && <span className="mf-dot" />}
      {label}
      {dot === 'right' && <span className="mf-dot" />}
    </span>
  );
}

export function StatusDot({ tone = 'neutral', accessibilityLabel }: StatusDotProps) {
  return (
    <span
      className="mf-status"
      data-tone={tone}
      role={accessibilityLabel ? 'img' : undefined}
      aria-label={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
    />
  );
}

export function FilterChip({ label, onPress }: FilterChipProps) {
  return (
    <button type="button" className="mf-chip mf-focusable" onClick={onPress}>
      {label}
    </button>
  );
}

export function Tag({ label, count, active, onPress }: TagProps) {
  return (
    <button type="button" role="tab" aria-selected={!!active} className="mf-tag mf-focusable" onClick={onPress}>
      <span className="mf-t-body1">{label}</span>
      {count !== undefined && <span className="mf-tag-count">{count}</span>}
    </button>
  );
}

/* ---------- Cards (Figma section 529:23194) ---------- */

export function Card({ children, padded = true, elevated = true, onPress }: CardProps & { children?: ReactNode }) {
  return (
    <div
      className="mf-card"
      data-padded={padded ? '' : undefined}
      data-elevated={elevated ? '' : undefined}
      onClick={onPress}
    >
      {children}
    </div>
  );
}

function Img({ src, className }: { src?: string; className: string }) {
  return src ? <img src={src} alt="" className={`mf-img ${className}`} /> : <span className={`mf-img ${className}`} />;
}

export function DrugCard({ name, pharmacy, distance, priceKobo, imageUrl, onPress }: DrugCardProps) {
  return (
    <div className="mf-drug" onClick={onPress}>
      <Img src={imageUrl} className="mf-drug-img" />
      <div className="mf-drug-content">
        <span className="mf-tm-h5" style={{ color: 'var(--mf-text-body)' }}>{name}</span>
        <Text variant="body3" color="var(--mf-text-secondary)">
          {distance ? `${pharmacy} · ${distance}` : pharmacy}
        </Text>
      </div>
      <span className="mf-tm-h5" style={{ color: 'var(--mf-text-heading)' }}>{formatNaira(priceKobo)}</span>
    </div>
  );
}

export function MedicationCard({ title, subtitle, imageUrl, onAdd }: MedicationCardProps) {
  return (
    <div className="mf-med">
      <Img src={imageUrl} className="mf-med-img" />
      <div className="mf-med-details">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <Text variant="body2" color="var(--mf-text-primary)">{title}</Text>
          {subtitle && <Text variant="caption1" color="var(--mf-text-secondary)">{subtitle}</Text>}
        </div>
        <Button icon="add" size="small" onPress={onAdd} accessibilityLabel={`Add ${title}`} />
      </div>
    </div>
  );
}

export function PhotoCard({ title, subtitle, imageUrl }: PhotoCardProps) {
  return (
    <div className="mf-photo">
      <Img src={imageUrl} className="mf-photo-img" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="mf-tm-h5" style={{ color: 'var(--mf-text-heading)' }}>{title}</span>
        {subtitle && <Text variant="body3" color="var(--mf-text-secondary)">{subtitle}</Text>}
      </div>
    </div>
  );
}

export function CalloutCard({ title, body, icon = 'message', linkLabel, buttonLabel, onPress }: CalloutCardProps) {
  return (
    <div className="mf-callout">
      <span className="mf-callout-icon">
        <Icon name={icon} size={sizes.icon.xl} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text variant="h5" color="var(--mf-text-primary)">{title}</Text>
        <Text variant="body3" as="p" color="var(--mf-text-secondary)" className="mf-callout-body">{body}</Text>
        {linkLabel && (
          <a className="mf-callout-link mf-t-caption1 mf-focusable" href="#" onClick={(e) => { e.preventDefault(); onPress?.(); }}>
            <Icon name="message" size={sizes.icon.lg} />
            {linkLabel}
          </a>
        )}
        {buttonLabel && (
          <div>
            <Button label={buttonLabel} variant="secondary" onPress={onPress} />
          </div>
        )}
      </div>
    </div>
  );
}

export function InsightCard({ title, value, insight, trend = 'up', onDismiss, forcePressed }: InsightCardProps) {
  return (
    <div className="mf-insight" data-pressed={forcePressed ? '' : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="mf-t-h5" style={{ flex: 1, color: 'var(--mf-text-heading)' }}>{title}</span>
        {onDismiss && (
          <button type="button" className="mf-icon-btn mf-focusable" onClick={onDismiss} aria-label="Dismiss">
            <Icon name="close" size={sizes.icon.lg} />
          </button>
        )}
      </div>
      <span className="mf-insight-value">{value}</span>
      {insight && (
        <span className="mf-t-h5" style={{ color: trend === 'up' ? 'var(--mf-text-success)' : 'var(--mf-text-error)' }}>
          {insight}
        </span>
      )}
    </div>
  );
}

/* ---------- Toast (Figma 2457:85043) ---------- */

export function Toast({ message, tone = 'success' }: ToastProps) {
  const icon = tone === 'success' ? 'tick-circle' : tone === 'error' ? 'danger-circle' : 'info-circle';
  return (
    <div className="mf-toast" role="status" aria-live="polite">
      <Icon name={icon} size={sizes.icon.md} color={`var(--mf-toast-${tone})`} />
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}
