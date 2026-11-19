import Svg, { Path } from 'react-native-svg';
import { icons, strokeWidthFor, type IconName } from '../icons/icons.ts';
import { useTheme } from './ThemeProvider.tsx';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
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
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
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
