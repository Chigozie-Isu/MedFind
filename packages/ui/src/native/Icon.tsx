import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { icons, strokeWidthFor, type IconName } from '../icons/icons.ts';
import { useTheme } from './ThemeProvider.tsx';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * react-native-svg passes `accessible` straight to the DOM on web, where React warns about it,
 * so the web build gets role/aria-label instead.
 */
export function a11y(label: string | undefined): object {
  if (!label) return Platform.OS === 'web' ? { 'aria-hidden': true } : { accessible: false };
  return Platform.OS === 'web' ? { role: 'img', 'aria-label': label } : { accessible: true, accessibilityLabel: label };
}

export function Icon({ name, size = 24, color, accessibilityLabel }: IconProps) {
  const { colors } = useTheme();
  const def = icons[name];
  const c = color ?? colors.icon.default;
  const sw = strokeWidthFor(def, size);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${def.box} ${def.box}`}
      fill="none"
      {...a11y(accessibilityLabel)}
    >
      {def.paths.map((p, i) =>
        p.kind === 'stroke' ? (
          <Path
            key={i}
            d={p.d}
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin={p.roundJoin ? 'round' : 'miter'}
            fill="none"
          />
        ) : (
          <Path key={i} d={p.d} fill={c} />
        ),
      )}
    </Svg>
  );
}
