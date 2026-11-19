/**
 * Props shared by the native (customer app) and web (pharmacy app) versions
 * of each component, so both take exactly the same inputs.
 */
import type { IconName } from './icons/icons.ts';
import type { StatusTone } from './theme.ts';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'inline'
  | 'text'
  | 'destructive-primary'
  | 'destructive-secondary'
  | 'destructive-inline';

export type ButtonSize = 'large' | 'medium' | 'small';

/** Forces a visual state, for the Components screens. Real use leaves it unset. */
export type InteractionState = 'default' | 'hover' | 'pressed' | 'disabled';

export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon shown after the label ("With Icon" in Figma), or alone if there is no label. */
  icon?: IconName;
  /** Icon shown before the label ("Icon Left" in Figma). */
  iconLeft?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /**
   * While `loading`, show this label (e.g. "Signing in…") in the normal colours instead of a
   * spinner, as the Figma loading states do.
   */
  loadingLabel?: string;
  fullWidth?: boolean;
  onPress?: () => void;
  /** Web only: `submit` submits the surrounding form. */
  type?: 'button' | 'submit';
  /** Accessible name; required for icon-only buttons. */
  accessibilityLabel?: string;
  forceState?: InteractionState;
}

export type FieldState = 'default' | 'focus' | 'filled' | 'error' | 'disabled';

export interface TextFieldProps {
  label?: string;
  required?: boolean;
  /** Shows the info icon after the label. */
  info?: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  /** Masks the value and shows the eye toggle. */
  secure?: boolean;
  /** `web` uses the taller 51px box from the web variant. */
  size?: 'mobile' | 'web';
  keyboard?: 'default' | 'email' | 'phone' | 'number';
  /** Lets password managers and SMS autofill help. */
  autoComplete?: 'email' | 'username' | 'current-password' | 'new-password' | 'tel' | 'one-time-code' | 'name' | 'off';
  onSubmitEditing?: () => void;
  forceState?: FieldState;
}

export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  size?: 'mobile' | 'web';
  forceState?: 'default' | 'focus' | 'filled';
}

export interface CodeInputProps {
  /** Number of digits, e.g. 6 for a pickup code or 5 for a staff passcode. */
  length?: number;
  /** Digits per group; groups are separated by a dash. 0 for no groups. */
  groupSize?: number;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: boolean;
  secure?: boolean;
  accessibilityLabel?: string;
}

export interface RadioProps {
  selected?: boolean;
  disabled?: boolean;
}

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface OptionRowProps {
  title: string;
  description?: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  /** Text button on the right, e.g. "Top up". */
  actionLabel?: string;
  onAction?: () => void;
}

export interface OptionListProps {
  options: Array<Omit<OptionRowProps, 'selected' | 'onPress'> & { value: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

export interface ChecklistItemProps {
  title: string;
  subtitle?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  /** Image URL for the 42px thumbnail. */
  imageUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
  forcePressed?: boolean;
}

export type BadgeDot = 'none' | 'left' | 'right';

export interface BadgeProps {
  label: string;
  tone?: StatusTone;
  /** `outline` is the "Not filled" variant. */
  appearance?: 'filled' | 'outline';
  dot?: BadgeDot;
}

export interface StatusDotProps {
  tone?: StatusTone;
  accessibilityLabel?: string;
}

export interface FilterChipProps {
  label: string;
  onPress?: () => void;
}

export interface TagProps {
  label: string;
  count?: number | string;
  active?: boolean;
  onPress?: () => void;
}

export interface CardProps {
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
}

export interface DrugCardProps {
  name: string;
  pharmacy: string;
  distance?: string;
  /** Price in kobo. */
  priceKobo: number;
  imageUrl?: string;
  onPress?: () => void;
}

export interface MedicationCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onAdd?: () => void;
}

export interface PhotoCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface CalloutCardProps {
  title: string;
  body: string;
  icon?: IconName;
  linkLabel?: string;
  buttonLabel?: string;
  onPress?: () => void;
}

export interface InsightCardProps {
  title: string;
  value: string;
  insight?: string;
  trend?: 'up' | 'down';
  onDismiss?: () => void;
  forcePressed?: boolean;
}

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
}

export type CustomerTab = 'home' | 'reservation' | 'saved';

export interface TabBarProps {
  active: CustomerTab;
  onChange?: (tab: CustomerTab) => void;
}

export interface ToggleProps {
  value: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface SideNavItem {
  key: string;
  label: string;
  icon: IconName;
  count?: number;
  href?: string;
}

export interface TakingReservationsProps {
  live: boolean;
  onChange?: (live: boolean) => void;
}
