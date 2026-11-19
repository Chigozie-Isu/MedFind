/**
 * Colour ramps from the MedFind Figma file (Colour Palette page, frame 31:55
 * and the neutral ramp in frame 28:287). These are raw values. Screens and
 * components should use the semantic tokens in `theme.ts`, never these
 * directly, so light and dark mode stay in sync.
 */
export const palette = {
  primary: {
    50: '#F0F8FF',
    100: '#DDF0FE',
    200: '#BCE2FF',
    300: '#92CAF4',
    400: '#65AEE3',
    500: '#3290CC',
    600: '#0077B6', // Primary/Default (brand)
    700: '#005886', // Primary/Hover
    800: '#004165', // Primary/Pressed
    900: '#002B44',
    darkModeText: '#5EAAD2', // Primary/Dark mode/Text
  },
  accent: {
    400: '#FEC9C0',
    500: '#FE9C8E',
    default: '#FF6B5A',
    hover: '#E25142',
    pressed: '#C23A2E',
  },
  success: {
    50: '#ECFBEF',
    highlight: '#DBF5E1',
    highlightHover: '#BEE9C8',
    highlightPressed: '#95D4A5',
    400: '#68BC81',
    500: '#349F5C',
    default: '#037B3E',
    hover: '#086331',
    pressed: '#004B22',
    900: '#003114',
    darkModeText: '#5DB37C',
  },
  warning: {
    50: '#FFF6E6',
    highlight: '#FFECCD',
    200: '#FFE0AD',
    300: '#FED48C',
    400: '#FEBE42',
    500: '#ECAA14',
    default: '#EBA609',
    hover: '#D29405',
    pressed: '#B78105',
    text: '#8D6304',
  },
  error: {
    50: '#FFF4F2',
    highlight: '#FFE6E3',
    highlightHover: '#FFCFC9',
    disabled: '#FDA99F', // also Highlight-pressed
    400: '#FB796D',
    500: '#E34B43',
    default: '#BE2323',
    hover: '#9A1416',
    pressed: '#750C0E',
    900: '#4F0507',
    darkModeText: '#DD8A8A',
  },
  info: {
    highlight: '#EAFAFE',
    100: '#D8F2F9',
    200: '#B8E5F1',
    300: '#8BCFE0',
    400: '#58B5CB',
    default: '#0398B1',
    text: '#027B8F',
    700: '#065D6D',
    800: '#034551',
    900: '#022D36',
  },
  neutral: {
    25: '#F9FCFE',
    50: '#F3F7FA',
    100: '#E6ECF1',
    200: '#DBE2E9',
    300: '#CDD2D5',
    400: '#BFC9D0',
    500: '#5F6B74',
    600: '#3F505D',
    700: '#213747',
    800: '#11293A',
    900: '#000C18',
    1000: '#000914',
  },
  surfaceLight: {
    default: '#F7FBFD',
    raised: '#FDFEFE',
    hover: '#EFF4F8',
    pressed: '#E6ECF1',
  },
  mapMarker: '#6393F2',
  white: '#FFFFFF',
} as const;

export type Palette = typeof palette;
