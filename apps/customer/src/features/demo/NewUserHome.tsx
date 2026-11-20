import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { boxShadow, radii, sizes, space } from '@medfind/ui';
import { Button, Icon, Text, useTheme } from '@medfind/ui/native';

const capsule = require('../../../assets/demo/mascot-capsule.png') as ImageSourcePropType;

/** "What others are searching for" cards on Home – new user (Figma 363:7759). */
const popular: { q: string; title: string; searches: number; image: ImageSourcePropType }[] = [
  { q: 'Actifed', title: 'Actifed', searches: 89, image: require('../../../assets/demo/actifed-shelf.png') },
  { q: 'Kidswell', title: 'Kidswell', searches: 56, image: require('../../../assets/demo/kidswell-shelf.png') },
];

/**
 * Home – new user (Figma 363:7759): shown until the first reservation, in place of History.
 * "Search for medication" opens Search; "Take a photo" runs the demo pack scan.
 */
export function NewUserHome({ onSearch, onScan }: { onSearch: (q: string) => void; onScan: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.mascot, { backgroundColor: colors.surface.raised }]}>
        <Image source={capsule} style={styles.capsule} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.copy}>
        <Text variant="h3" accessibilityRole="header">
          No history yet
        </Text>
        <Text variant="body1" color="body">
          Medicines you pick up will show up here, ready to reorder in a tap.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Search for medication" size="small" iconLeft="search" onPress={() => router.push('/search')} />
        <Button label="Take a photo of your medication" variant="secondary" size="small" iconLeft="camera" onPress={onScan} />
      </View>

      <Pressable onPress={() => router.push('/search')} accessibilityRole="button" style={styles.titleRow}>
        <Text variant="h3" style={styles.flex}>
          What others are searching for
        </Text>
        <Icon name="chevron-right" size={sizes.icon.md} color={colors.icon.default} />
      </Pressable>
      <View style={styles.cards}>
        {popular.map((p) => (
          <Pressable
            key={p.q}
            onPress={() => onSearch(p.q)}
            accessibilityRole="button"
            accessibilityLabel={`Search for ${p.title}`}
            style={[styles.card, { backgroundColor: colors.surface.raised, boxShadow: boxShadow('card') }]}
          >
            <Image source={p.image} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
            <View style={styles.cardBody}>
              <View style={styles.flex}>
                <Text variant="body2" numberOfLines={1}>
                  {p.title}
                </Text>
                <Text variant="caption1" color="secondary">
                  {String(p.searches).padStart(3, '0')} searches
                </Text>
              </View>
              <View style={[styles.searchBtn, { backgroundColor: colors.brand.default }]}>
                <Icon name="search" size={sizes.icon.sm} color={colors.text.onBrand} />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  flex: { flex: 1 },
  mascot: { width: 88, height: 88, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  capsule: { width: 88, height: 88 },
  copy: { gap: space.xs },
  actions: { alignItems: 'flex-start', gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm },
  cards: { flexDirection: 'row', gap: space.sm },
  card: { flex: 1, borderRadius: radii.xl, overflow: 'hidden' },
  photo: { width: '100%', height: 92 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.md },
  searchBtn: { width: 32, height: 32, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
