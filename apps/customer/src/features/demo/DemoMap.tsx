import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { radii, space } from '@medfind/ui';
import { Icon, Text, useTheme } from '@medfind/ui/native';

/**
 * The map at the top of the Pickup code and Delivery screens (Figma "map 2" with the
 * pharmacy pin, the customer dot, the route and the travel-time bubble).
 *
 * Drawn from OpenStreetMap tiles (free, fair use; Leaflet + OSM was approved) laid out
 * as plain images, so it works on phones and the web without a map library.
 */
const TILE = 256;
const ZOOM = 15;

type LatLng = { lat: number; lng: number };

function worldPx({ lat, lng }: LatLng, z = ZOOM) {
  const scale = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * scale;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function DemoMap({
  pharmacy,
  pharmacyName,
  me,
  eta,
  height = 300,
}: {
  pharmacy: LatLng;
  pharmacyName: string;
  me: LatLng;
  /** Travel-time bubble, e.g. "45 mins". */
  eta?: string;
  height?: number;
}) {
  const { colors, scheme } = useTheme();
  const [width, setWidth] = useState(375);
  const a = worldPx(pharmacy);
  const b = worldPx(me);
  // Centre between the two points, nudged up so the sheet doesn't cover them.
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 + height * 0.12;
  const left = cx - width / 2;
  const top = cy - height / 2;
  const tiles: Array<{ x: number; y: number; key: string }> = [];
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++)
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty++) tiles.push({ x: tx, y: ty, key: `${tx}-${ty}` });

  const pa = { x: a.x - left, y: a.y - top };
  const pb = { x: b.x - left, y: b.y - top };
  // A street-like route: across, then up.
  const corner = { x: pb.x, y: pa.y };
  const route = `M${pa.x} ${pa.y} L${corner.x} ${corner.y} L${pb.x} ${pb.y}`;

  return (
    <View
      style={[styles.map, { height, backgroundColor: colors.surface.muted }]}
      onLayout={(e) => setWidth(Math.max(1, Math.round(e.nativeEvent.layout.width)))}
      accessibilityLabel={`Map showing ${pharmacyName}${eta ? `, ${eta} away` : ''}`}
    >
      {tiles.map((t) => (
        <Image
          key={t.key}
          source={{ uri: `https://tile.openstreetmap.org/${ZOOM}/${t.x}/${t.y}.png` }}
          style={{ position: 'absolute', left: t.x * TILE - left, top: t.y * TILE - top, width: TILE, height: TILE }}
        />
      ))}
      {scheme === 'dark' && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17, 41, 58, 0.45)' }]} pointerEvents="none" />}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Path d={route} stroke={colors.brand.default} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={pb.x} cy={pb.y} r={10} fill={colors.surface.raised} stroke={colors.text.error} strokeWidth={3} />
        <Circle cx={pb.x} cy={pb.y} r={4} fill={colors.text.error} />
      </Svg>
      <View style={[styles.pin, { left: pa.x - 70, top: pa.y - 76 }]} pointerEvents="none">
        <View style={[styles.bubble, { backgroundColor: colors.surface.raised }]}>
          <Text variant="label2" color="heading" numberOfLines={1}>
            {pharmacyName}
          </Text>
        </View>
        <Icon name="location" size={32} color={colors.mapMarker} />
      </View>
      {eta && (
        <View style={[styles.eta, { left: corner.x - 40, top: (corner.y + pb.y) / 2 - 14, backgroundColor: colors.surface.raised }]} pointerEvents="none">
          <Text variant="label2" color="heading">
            {eta}
          </Text>
        </View>
      )}
      <View style={[styles.credit, { backgroundColor: colors.surface.raised }]} pointerEvents="none">
        <Text variant="caption2" color="secondary">
          © OpenStreetMap
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { overflow: 'hidden', width: '100%' },
  pin: { position: 'absolute', width: 140, alignItems: 'center', gap: space.xxs },
  bubble: { paddingHorizontal: space.sm, paddingVertical: space.xxs, borderRadius: radii.lg },
  eta: { position: 'absolute', width: 80, alignItems: 'center', paddingVertical: space.xxs, borderRadius: radii.lg },
  credit: { position: 'absolute', right: 0, bottom: 28, paddingHorizontal: space.xxs, opacity: 0.85 },
});
