import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@medfind/ui/native';

/**
 * A few extra line icons the new screens need that aren't in @medfind/ui yet
 * (user, edit, copy, star, bank, call, ...). Drawn on a 24px grid with a 1.5px
 * stroke to match the Hicon Linear set. Logged in docs/design-deviations.md.
 */
export type ExtraIconName =
  | 'user'
  | 'edit'
  | 'copy'
  | 'star'
  | 'bank'
  | 'call'
  | 'palette'
  | 'logout'
  | 'refresh'
  | 'trash'
  | 'gallery'
  | 'file'
  | 'chat'
  | 'directions'
  | 'send'
  | 'mail';

export function ExtraIcon({
  name,
  size = 24,
  color,
  filled,
}: {
  name: ExtraIconName;
  size?: number;
  color?: string;
  /** Solid star (rating). */
  filled?: boolean;
}) {
  const { colors } = useTheme();
  const c = color ?? colors.icon.default;
  const p = { stroke: c, strokeWidth: (1.5 * 24) / size, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={3.5} {...p} />
          <Path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" {...p} />
        </>
      )}
      {name === 'edit' && <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" {...p} />}
      {name === 'copy' && (
        <>
          <Rect x={8} y={8} width={12} height={12} rx={3} {...p} />
          <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" {...p} />
        </>
      )}
      {name === 'star' && (
        <Path
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"
          {...p}
          fill={filled ? c : 'none'}
        />
      )}
      {name === 'bank' && <Path d="M3 9.5 12 4l9 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" {...p} />}
      {name === 'call' && (
        <Path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" {...p} />
      )}
      {name === 'palette' && (
        <>
          <Path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-2l-.4-1a1.6 1.6 0 0 1 1.5-2.2H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3Z" {...p} />
          <Circle cx={7.5} cy={11} r={1} {...p} />
          <Circle cx={10.5} cy={7} r={1} {...p} />
          <Circle cx={15} cy={7.5} r={1} {...p} />
        </>
      )}
      {name === 'logout' && <Path d="M14 4h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3M10 8l-4 4 4 4M6 12h9" {...p} />}
      {name === 'refresh' && <Path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" {...p} />}
      {name === 'trash' && <Path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v5M14 11v5" {...p} />}
      {name === 'gallery' && (
        <>
          <Rect x={3.5} y={4.5} width={17} height={15} rx={3} {...p} />
          <Circle cx={9} cy={10} r={1.5} {...p} />
          <Path d="m4 17 5-4 4 3 3-2 4 3" {...p} />
        </>
      )}
      {name === 'file' && <Path d="M14 3H8a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8l-5-5Zm0 0v5h5M9 13h6M9 17h4" {...p} />}
      {name === 'chat' && <Path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6ZM8 9h8M8 12.5h5" {...p} />}
      {name === 'directions' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Path d="m9 15 1.5-4.5L15 9l-1.5 4.5L9 15Z" {...p} />
        </>
      )}
      {name === 'send' && <Path d="M4 12 20 4l-4 16-4-6.5L4 12Zm8 1.5L20 4" {...p} />}
      {name === 'mail' && (
        <>
          <Rect x={3.5} y={5} width={17} height={14} rx={3} {...p} />
          <Path d="m4 7 8 6 8-6" {...p} />
        </>
      )}
    </Svg>
  );
}
