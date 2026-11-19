import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import {
  mobileText,
  nativeFontNames,
  type TextStyleToken,
  type TextVariant,
} from '../tokens/typography.ts';
import type { ThemeColors } from '../theme.ts';
import { useTheme } from './ThemeProvider.tsx';

/** React Native style for a text token (font name already includes the weight). */
export function textStyle(token: TextStyleToken): TextStyle {
  return {
    fontFamily: nativeFontNames[token.family][token.weight],
    fontSize: token.size,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
  };
}

export type TextColor = keyof ThemeColors['text'];

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
}

export function Text({ variant = 'body2', color = 'primary', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[textStyle(mobileText[variant]), { color: colors.text[color] }, style]} />;
}
