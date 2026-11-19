/**
 * Text styles from the Figma file's local text styles (e.g. `H1/Mobile`,
 * `Body2/Web`). These follow the real styles, not the labels drawn on the
 * Typescale page, which disagree with them (for example the page says H1 is
 * Bold 700 and web H1 is 48px; the styles are SemiBold 600 and 40px).
 *
 * Headings H1-H3 use Poppins. Everything else uses Manrope.
 * `lineHeight` and `letterSpacing` are already converted to pixels.
 */
export type FontFamily = 'poppins' | 'manrope';
export type FontWeight = 400 | 500 | 600;

export interface TextStyleToken {
  family: FontFamily;
  weight: FontWeight;
  size: number;
  lineHeight: number;
  letterSpacing: number;
}

/** letterSpacing in Figma is a percentage of the font size. */
function style(
  family: FontFamily,
  weight: FontWeight,
  size: number,
  lineHeight: number,
  letterSpacingPercent: number,
  lineHeightIsMultiplier = lineHeight < 3,
): TextStyleToken {
  return {
    family,
    weight,
    size,
    lineHeight: round(lineHeightIsMultiplier ? size * lineHeight : lineHeight),
    letterSpacing: round((size * letterSpacingPercent) / 100),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const mobileText = {
  h1: style('poppins', 600, 28, 1.2, -2),
  h2: style('poppins', 600, 24, 1.2, -2),
  h3: style('poppins', 600, 19, 1.25, -2),
  h4: style('manrope', 600, 17, 1.3, -1),
  h5: style('manrope', 600, 16, 1.5, 0),
  body1: style('manrope', 400, 17, 25.5, 2),
  body2: style('manrope', 400, 16, 24, 2),
  body3: style('manrope', 400, 15, 22.5, 2),
  button1: style('manrope', 600, 16, 1, 1),
  button2: style('manrope', 600, 14, 1, 1),
  button3: style('manrope', 600, 12, 1, 1),
  label1: style('manrope', 500, 14, 21, 2),
  label2: style('manrope', 500, 13, 19.5, 2),
  caption1: style('manrope', 500, 12, 18, 2),
  caption2: style('manrope', 500, 11, 15.4, 2),
} as const satisfies Record<string, TextStyleToken>;

export const webText = {
  h1: style('poppins', 600, 40, 1.2, -2),
  h2: style('poppins', 600, 36, 1.2, -2),
  h3: style('poppins', 600, 28, 1.25, -1.5),
  h4: style('manrope', 600, 22, 1.35, -1),
  h5: style('manrope', 500, 20, 1.4, -1),
  body1: style('manrope', 400, 18, 27, 2),
  body2: style('manrope', 400, 16, 24, 2),
  body3: style('manrope', 400, 14, 1.5, 2),
  button1: style('manrope', 600, 16, 1, 1),
  button2: style('manrope', 600, 14, 1, 1),
  button3: style('manrope', 600, 12, 1, 1),
  label1: style('manrope', 500, 14, 21, 2),
  label2: style('manrope', 500, 13, 19.5, 2),
  caption1: style('manrope', 500, 12, 18, 2),
  caption2: style('manrope', 500, 11, 15.4, 2),
} as const satisfies Record<string, TextStyleToken>;

export type TextVariant = keyof typeof mobileText;

/**
 * A few component frames use text sizes that sit outside the named styles
 * (e.g. 22px SemiBold digits in the code input, 40px numbers on insight
 * cards). They are kept here so components never hard-code them.
 */
export const componentText = {
  codeDigit: style('manrope', 600, 22, 1.35, -1),
  codeSeparator: style('manrope', 600, 28, 1.2, 0),
  insightNumber: style('poppins', 600, 40, 1.2, -2),
} as const satisfies Record<string, TextStyleToken>;

/** Font names registered by @expo-google-fonts in the customer app. */
export const nativeFontNames: Record<FontFamily, Partial<Record<FontWeight, string>>> = {
  poppins: { 600: 'Poppins_600SemiBold' },
  manrope: {
    400: 'Manrope_400Regular',
    500: 'Manrope_500Medium',
    600: 'Manrope_600SemiBold',
  },
};

/** CSS font stacks for the pharmacy app (next/font sets the variables). */
export const webFontStacks: Record<FontFamily, string> = {
  poppins: "var(--font-poppins), 'Poppins', system-ui, sans-serif",
  manrope: "var(--font-manrope), 'Manrope', system-ui, sans-serif",
};
