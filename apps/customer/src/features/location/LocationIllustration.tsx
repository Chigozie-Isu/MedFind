import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@medfind/ui/native';

/**
 * "Illustration/ Location" from Figma (Location access section, 260 x 260).
 * The variants match the screens: `base` (allow access), `finding` (extra ring),
 * `found` (blue tick, also used for "address set") and `off` (grey pin, red cross).
 * Colours are the illustration's own, exported from Figma; light and dark are the
 * same except the pin's ring is a touch stronger in dark mode.
 */
export type LocationIllustrationVariant = 'base' | 'finding' | 'found' | 'off';

const C = {
  disc: '#2B9FDC',
  shadow: '#1D7EB0',
  card: '#FFFFFF',
  block: '#EAF6FD',
  road: '#D5ECF9',
  brand: '#0077B6',
  pin: '#FF6B5A',
  pinOff: '#9FB3C2',
  pinOffDot: '#6B7F8E',
};

export function LocationIllustration({ variant = 'base', size = 260 }: { variant?: LocationIllustrationVariant; size?: number }) {
  const { scheme } = useTheme();
  const off = variant === 'off';
  const ringOpacity = variant === 'finding' ? 0.45 : scheme === 'dark' ? 0.35 : 0.3;
  return (
    <Svg width={size} height={size} viewBox="0 0 260 260" fill="none" aria-hidden>
      <G clipPath="url(#loc-clip)">
        <Path d="M130 260C201.797 260 260 201.797 260 130C260 58.203 201.797 0 130 0C58.203 0 0 58.203 0 130C0 201.797 58.203 260 130 260Z" fill={C.disc} />
        <Path d="M129.999 238.333C174.034 238.333 209.732 234.065 209.732 228.8C209.732 223.535 174.034 219.267 129.999 219.267C85.9635 219.267 50.2656 223.535 50.2656 228.8C50.2656 234.065 85.9635 238.333 129.999 238.333Z" fill={C.shadow} />
        <Path d="M190.666 84.9333H69.3323C58.8021 84.9333 50.2656 93.4698 50.2656 104V182C50.2656 192.53 58.8021 201.067 69.3323 201.067H190.666C201.196 201.067 209.732 192.53 209.732 182V104C209.732 93.4698 201.196 84.9333 190.666 84.9333Z" fill={C.card} />
        <Path d="M155.133 93.6001H122.199C118.849 93.6001 116.133 96.3162 116.133 99.6668V117C116.133 120.351 118.849 123.067 122.199 123.067H155.133C158.483 123.067 161.199 120.351 161.199 117V99.6668C161.199 96.3162 158.483 93.6001 155.133 93.6001Z" fill={C.block} />
        <Path d="M87.5346 142.133H66.7346C63.3841 142.133 60.668 144.849 60.668 148.2V184.6C60.668 187.95 63.3841 190.667 66.7346 190.667H87.5346C90.8852 190.667 93.6013 187.95 93.6013 184.6V148.2C93.6013 144.849 90.8852 142.133 87.5346 142.133Z" fill={C.block} />
        <Path d="M193.265 142.133H179.399C176.048 142.133 173.332 144.849 173.332 148.2V184.6C173.332 187.95 176.048 190.667 179.399 190.667H193.265C196.616 190.667 199.332 187.95 199.332 184.6V148.2C199.332 144.849 196.616 142.133 193.265 142.133Z" fill={C.block} />
        <Path d="M50.2656 131.733H209.732" stroke={C.road} strokeWidth={10} />
        <Path d="M104 84.9333V201.067" stroke={C.road} strokeWidth={10} />
        <Path d="M169.867 84.9333L143.867 201.067" stroke={C.road} strokeWidth={6} />
        {!off && (
          <Path
            d="M130.001 181.133C153.934 181.133 173.335 175.313 173.335 168.133C173.335 160.954 153.934 155.133 130.001 155.133C106.069 155.133 86.668 160.954 86.668 168.133C86.668 175.313 106.069 181.133 130.001 181.133Z"
            stroke={C.brand}
            strokeOpacity={ringOpacity}
            strokeWidth={3}
          />
        )}
        {variant === 'finding' && (
          <Path
            d="M129.999 188.067C166.377 188.067 195.866 179.142 195.866 168.133C195.866 157.124 166.377 148.2 129.999 148.2C93.6223 148.2 64.1328 157.124 64.1328 168.133C64.1328 179.142 93.6223 188.067 129.999 188.067Z"
            stroke={C.brand}
            strokeOpacity={0.22}
            strokeWidth={3}
          />
        )}
        <Path d="M129.999 175.933C141.487 175.933 150.799 173.217 150.799 169.867C150.799 166.516 141.487 163.8 129.999 163.8C118.512 163.8 109.199 166.516 109.199 169.867C109.199 173.217 118.512 175.933 129.999 175.933Z" fill={C.shadow} fillOpacity={0.35} />
        <Path d="M130.001 62.3999C108.941 62.3999 91.8672 79.0399 91.8672 99.5799C91.8672 126.273 124.281 162.24 127.574 165.793C127.882 166.129 128.257 166.398 128.675 166.582C129.093 166.765 129.544 166.86 130.001 166.86C130.457 166.86 130.908 166.765 131.326 166.582C131.744 166.398 132.119 166.129 132.427 165.793C135.721 162.24 168.134 126.273 168.134 99.5799C168.134 79.0399 151.061 62.3999 130.001 62.3999Z" fill={off ? C.pinOff : C.pin} />
        <Path d="M129.999 114.4C138.136 114.4 144.732 107.804 144.732 99.6667C144.732 91.5297 138.136 84.9333 129.999 84.9333C121.862 84.9333 115.266 91.5297 115.266 99.6667C115.266 107.804 121.862 114.4 129.999 114.4Z" fill={C.card} />
        <Path d="M130 106.6C133.829 106.6 136.933 103.496 136.933 99.6667C136.933 95.8376 133.829 92.7334 130 92.7334C126.171 92.7334 123.066 95.8376 123.066 99.6667C123.066 103.496 126.171 106.6 130 106.6Z" fill={off ? C.pinOffDot : C.brand} />
        {(variant === 'found' || off) && (
          <Path
            d="M164.665 90.1332C174.238 90.1332 181.999 82.3728 181.999 72.7999C181.999 63.227 174.238 55.4666 164.665 55.4666C155.092 55.4666 147.332 63.227 147.332 72.7999C147.332 82.3728 155.092 90.1332 164.665 90.1332Z"
            fill={off ? C.pin : C.brand}
            stroke={C.card}
            strokeWidth={4}
          />
        )}
        {variant === 'found' && (
          <Path d="M156.867 73.2334L162.067 78.4334L172.467 68.0334" stroke={C.card} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {off && <Path d="M158.602 66.7334L170.735 78.8667M170.735 66.7334L158.602 78.8667" stroke={C.card} strokeWidth={3.5} strokeLinecap="round" />}
      </G>
      <Defs>
        <ClipPath id="loc-clip">
          <Rect width={260} height={260} fill="#FFFFFF" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
