import { palette as p } from './tokens/palette.ts';

export type ColorScheme = 'light' | 'dark';

export type StatusTone = 'neutral' | 'success' | 'info' | 'warning' | 'error';

interface StateColors {
  default: string;
  hover: string;
  pressed: string;
  disabled: string;
}

interface ToneColors {
  /** Filled badge background. */
  bg: string;
  /** Text on the filled background. */
  text: string;
  /** Dot inside badges. */
  dot: string;
  /** Border of the outline ("Not filled") badge. */
  border: string;
  /** Text of the outline badge. */
  outlineText: string;
  /** Status dot (16px) on its own. */
  status: string;
}

/**
 * Semantic colours. Every key exists in both light and dark so a component
 * written against `ThemeColors` works in either mode.
 */
export interface ThemeColors {
  surface: {
    /** Page background. */
    default: string;
    /** Cards, rows, tab bar, side nav. */
    raised: string;
    /** Muted panels: insight card, card details strip. */
    muted: string;
    hover: string;
    pressed: string;
    /** Dividers and quiet borders. */
    border: string;
    /** Selected option row background. */
    selected: string;
    /** Background of the toast. */
    inverse: string;
  };
  text: {
    /** Font 1: titles and the strongest text. */
    primary: string;
    /** Font 2: headings. */
    heading: string;
    /** Font 3: body copy. */
    body: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    /** Text on brand-filled backgrounds (buttons, selected tab). */
    onBrand: string;
    /** Text on the inverse (toast) background. */
    onInverse: string;
    /** Links and brand-coloured text. */
    brand: string;
    /** Required-field asterisk. Darker (light) / lighter (dark) than Figma's #FF6B5A to pass 4.5:1. */
    required: string;
    success: string;
    error: string;
  };
  icon: {
    default: string;
    onBrand: string;
  };
  brand: { default: string; hover: string; pressed: string };
  /** Brand-tinted panels, e.g. the count pill and callout card. */
  brandSubtle: string;
  accent: string;
  button: {
    primaryBg: StateColors;
    primaryText: string;
    secondary: StateColors;
    inline: StateColors;
    destructiveBg: StateColors;
    destructive: StateColors;
  };
  input: {
    border: string;
    borderFocus: string;
    borderFilled: string;
    borderError: string;
    borderDisabled: string;
    /** Inputs use a 40% border in Figma. */
    borderOpacity: number;
    background: string;
    placeholder: string;
    value: string;
    label: string;
    helper: string;
    helperError: string;
  };
  search: { border: string; borderFocus: string; borderFilled: string };
  control: {
    /** Radio ring and check box border when off. */
    off: string;
    on: string;
    optionBorder: string;
    optionBorderSelected: string;
    toggleOn: string;
    toggleOff: string;
    toggleKnob: string;
    /** Description and action text on a selected option row. */
    optionSelectedText: string;
    optionSelectedAction: string;
  };
  chip: { bg: string; text: string };
  nav: {
    itemText: string;
    itemIcon: string;
    countText: string;
    activeBg: string;
    activeText: string;
    activeCountBg: string;
    activeCountText: string;
  };
  tone: Record<StatusTone, ToneColors>;
  toast: { bg: string; text: string; success: string; error: string; info: string };
  mapMarker: string;
  /** Sign In / Sign Up switch on the customer log-in screens. */
  segment: { track: string; activeBg: string; activeText: string; inactiveText: string };
  /** Lines either side of "OR CONTINUE WITH". */
  divider: string;
}

/*
 * Where a light-mode Figma component uses #BFC9D0 (neutral/400) for label,
 * placeholder or helper text, it fails the 4.5:1 contrast rule on light
 * surfaces. In those places the light theme uses the light-mode counterpart
 * of the token the dark variant uses (e.g. dark helper text is Text/Tertiary,
 * so light helper text is Text/Light mode/Tertiary). See the PR notes.
 */
export const lightColors: ThemeColors = {
  surface: {
    default: p.surfaceLight.default,
    raised: p.surfaceLight.raised,
    muted: p.surfaceLight.hover,
    hover: p.surfaceLight.hover,
    pressed: p.surfaceLight.pressed,
    border: p.neutral[200],
    selected: p.info.highlight,
    inverse: p.neutral[800],
  },
  text: {
    primary: p.neutral[900],
    heading: p.neutral[800],
    body: '#253B4B',
    secondary: '#4B5A67',
    tertiary: p.neutral[500],
    disabled: p.neutral[200],
    onBrand: p.surfaceLight.raised,
    onInverse: p.neutral[25],
    brand: p.primary[600],
    required: p.accent.pressed,
    success: p.success.default,
    error: p.error.default,
  },
  icon: { default: p.neutral[900], onBrand: p.surfaceLight.raised },
  brand: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800] },
  brandSubtle: p.info.highlight,
  accent: p.accent.default,
  button: {
    primaryBg: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800], disabled: p.neutral[200] },
    primaryText: p.surfaceLight.raised,
    secondary: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800], disabled: p.neutral[200] },
    inline: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800], disabled: p.neutral[200] },
    destructiveBg: { default: p.error.default, hover: p.error.hover, pressed: p.error.pressed, disabled: p.error.disabled },
    destructive: { default: p.error.default, hover: p.error.hover, pressed: p.error.pressed, disabled: p.error.disabled },
  },
  input: {
    border: '#4B5A67',
    borderFocus: p.primary[600],
    borderFilled: '#253B4B',
    borderError: p.error.default,
    borderDisabled: p.neutral[200],
    borderOpacity: 0.4,
    background: p.surfaceLight.raised,
    placeholder: '#4B5A67',
    value: p.neutral[900],
    label: p.neutral[900],
    helper: p.neutral[500],
    helperError: p.error.default,
  },
  search: { border: '#4B5A67', borderFocus: p.primary[600], borderFilled: p.neutral[800] },
  control: {
    off: '#4B5A67',
    on: p.primary[600],
    optionBorder: p.neutral[500],
    optionBorderSelected: p.primary[600],
    toggleOn: p.primary[600],
    toggleOff: p.neutral[500],
    toggleKnob: p.neutral[900],
    optionSelectedText: '#4B5A67',
    optionSelectedAction: p.primary[600],
  },
  chip: { bg: p.neutral[200], text: p.neutral[900] },
  nav: {
    itemText: p.neutral[500],
    itemIcon: p.neutral[900],
    countText: p.neutral[500],
    activeBg: p.primary[600],
    activeText: p.surfaceLight.raised,
    activeCountBg: p.info.highlight,
    activeCountText: '#253B4B',
  },
  tone: {
    neutral: { bg: p.neutral[200], text: '#253B4B', dot: p.neutral[500], border: p.neutral[500], outlineText: p.neutral[500], status: p.neutral[500] },
    success: { bg: p.success.highlight, text: p.success.default, dot: p.success.default, border: p.success.default, outlineText: p.success.default, status: p.success.default },
    info: { bg: p.info.highlight, text: p.info.text, dot: p.info.default, border: p.info.default, outlineText: p.info.text, status: p.info.default },
    warning: { bg: p.warning.highlight, text: p.warning.text, dot: p.warning.default, border: p.warning.default, outlineText: p.warning.text, status: p.warning.default },
    error: { bg: p.error.highlight, text: p.error.default, dot: p.error.default, border: p.error.default, outlineText: p.error.default, status: p.error.default },
  },
  toast: { bg: p.neutral[800], text: p.neutral[25], success: p.success[400], error: p.error.disabled, info: p.info[300] },
  mapMarker: p.mapMarker,
  segment: { track: p.neutral[200], activeBg: p.primary[600], activeText: p.surfaceLight.default, inactiveText: p.primary[700] },
  divider: '#4B5A67',
};

/*
 * Dark surfaces were checked against the dark screens: the page background is
 * #11293A, cards and rows are #213747, and borders / pressed are #3F505D.
 *
 * Inline and Text buttons use #0077B6 on dark in Figma, which is about 3:1 on
 * #11293A and fails the 4.5:1 rule, so they use Primary/Dark mode/Text
 * (#5EAAD2), the same colour the dark Secondary button already uses.
 */
export const darkColors: ThemeColors = {
  surface: {
    default: p.neutral[800],
    raised: p.neutral[700],
    muted: p.neutral[700],
    hover: p.neutral[700],
    pressed: p.neutral[600],
    border: p.neutral[600],
    selected: p.neutral[600],
    inverse: p.neutral[700],
  },
  text: {
    primary: p.neutral[25],
    heading: p.neutral[50],
    body: '#EBF1F6',
    secondary: p.neutral[200],
    tertiary: p.neutral[400],
    disabled: '#4D5D69',
    onBrand: p.surfaceLight.raised,
    onInverse: p.neutral[25],
    brand: p.primary.darkModeText,
    required: p.accent[500],
    success: p.success[400],
    error: p.error.disabled,
  },
  icon: { default: p.neutral[25], onBrand: p.neutral[25] },
  brand: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800] },
  brandSubtle: p.neutral[700],
  accent: p.accent.default,
  button: {
    primaryBg: { default: p.primary[600], hover: p.primary[700], pressed: p.primary[800], disabled: p.neutral[600] },
    primaryText: p.surfaceLight.raised,
    secondary: { default: p.primary.darkModeText, hover: p.primary.darkModeText, pressed: p.primary.darkModeText, disabled: p.neutral[600] },
    inline: { default: p.primary.darkModeText, hover: p.primary.darkModeText, pressed: p.primary.darkModeText, disabled: p.neutral[600] },
    destructiveBg: { default: p.error.default, hover: p.error.hover, pressed: p.error.pressed, disabled: p.error.disabled },
    destructive: { default: p.error.disabled, hover: p.error.disabled, pressed: p.error.disabled, disabled: p.error.disabled },
  },
  input: {
    border: p.neutral[200],
    borderFocus: p.primary[600],
    borderFilled: '#EBF1F6',
    borderError: p.error.disabled,
    borderDisabled: p.neutral[600],
    borderOpacity: 0.4,
    background: 'transparent',
    placeholder: p.neutral[200],
    value: '#EBF1F6',
    label: p.neutral[25],
    helper: p.neutral[400],
    helperError: p.error.darkModeText,
  },
  search: { border: p.neutral[200], borderFocus: p.primary[600], borderFilled: p.neutral[50] },
  control: {
    off: p.neutral[200],
    on: p.primary[600],
    optionBorder: p.neutral[400],
    optionBorderSelected: p.primary[600],
    toggleOn: p.primary[600],
    toggleOff: p.neutral[500],
    toggleKnob: p.neutral[900],
    optionSelectedText: '#EBF1F6',
    optionSelectedAction: p.neutral[25],
  },
  chip: { bg: p.neutral[600], text: p.neutral[25] },
  nav: {
    itemText: p.neutral[25],
    itemIcon: p.neutral[25],
    countText: p.neutral[200],
    activeBg: p.primary[600],
    activeText: p.neutral[25],
    activeCountBg: p.info.highlight,
    activeCountText: '#253B4B',
  },
  tone: {
    neutral: { bg: p.neutral[600], text: '#EBF1F6', dot: p.neutral[400], border: p.neutral[400], outlineText: p.neutral[400], status: p.neutral[400] },
    success: { bg: p.success.highlight, text: p.success.default, dot: p.success.default, border: p.success[400], outlineText: p.success.highlight, status: p.success[400] },
    info: { bg: p.info.highlight, text: p.info.text, dot: p.info.default, border: p.info.default, outlineText: p.info.highlight, status: p.info.default },
    warning: { bg: p.warning.highlight, text: p.warning.text, dot: p.warning.default, border: p.warning.default, outlineText: p.warning.default, status: p.warning.default },
    error: { bg: p.error.highlight, text: p.error.default, dot: p.error.default, border: p.error.disabled, outlineText: p.error.disabled, status: p.error.disabled },
  },
  toast: { bg: p.neutral[700], text: p.neutral[25], success: p.success[400], error: p.error.disabled, info: p.info[300] },
  mapMarker: p.mapMarker,
  segment: { track: p.neutral[600], activeBg: p.primary[600], activeText: p.neutral[25], inactiveText: p.neutral[25] },
  divider: p.neutral[200],
};

export const themes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
