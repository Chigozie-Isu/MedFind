/**
 * Spacing, corner radii, sizes and shadows. Figma has no variables for these,
 * so the values are taken from the component frames (auto-layout padding,
 * gaps and corner radii) on the Components and Buttons pages.
 */

/** Spacing scale used by auto-layout padding and gaps across the components. */
export const space = {
  none: 0,
  xxs: 4, // badge vertical padding, check box inner padding
  xs: 8, // small button padding, input vertical padding, most gaps
  sm: 12, // toast gap, card detail gap
  md: 16, // card and row padding, button horizontal padding (small)
  lg: 24, // button horizontal padding, checklist gap, side nav padding
  xl: 32, // side nav "Live" block gap
  xxl: 40,
} as const;

export type SpaceToken = keyof typeof space;

/** Corner radii seen in the component frames. */
export const radii = {
  none: 0,
  sm: 8, // check box, code-input box
  md: 12, // toast
  lg: 16, // inputs, badges, list images
  xl: 24, // buttons, cards, option rows, tab bar, side nav items
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

/** Fixed component sizes from the frames. */
export const sizes = {
  button: {
    large: { height: 48, paddingX: 24, paddingY: 16, iconOnly: 56, icon: 16, iconOnlyIcon: 24 },
    medium: { height: 46, paddingX: 24, paddingY: 16, iconOnly: 48, icon: 16, iconOnlyIcon: 16 },
    small: { height: 28, paddingX: 16, paddingY: 8, iconOnly: 32, icon: 16, iconOnlyIcon: 16 },
  },
  icon: { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 },
  radio: 20,
  checkbox: 24,
  badgeDot: 8,
  statusDot: 16,
  codeBox: { width: 34, height: 49 },
  toggle: { width: 44, height: 22, knob: 18.33 },
  tabBar: { height: 66 },
  sideNav: { width: 354, item: 56 },
  border: { hairline: 1, strong: 1.5 },
} as const;

/** Drop shadows. `cards` is the Figma effect style of the same name. */
export const shadows = {
  card: [
    { x: 0, y: 6, blur: 20, color: 'rgba(0, 0, 0, 0.05)' },
    { x: 0, y: 1, blur: 4, color: 'rgba(0, 0, 0, 0.03)' },
  ],
  toast: [{ x: 0, y: 8, blur: 24, color: 'rgba(0, 9, 20, 0.16)' }],
} as const;

export type ShadowToken = keyof typeof shadows;

/** CSS / React Native `boxShadow` string for a shadow token. */
export function boxShadow(token: ShadowToken): string {
  return shadows[token].map((s) => `${s.x}px ${s.y}px ${s.blur}px 0px ${s.color}`).join(', ');
}

/** Design frame sizes for each app. */
export const frames = {
  customer: { width: 375, height: 812 },
  pharmacy: { width: 1440, height: 1024 },
} as const;
