import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, space } from '@medfind/ui';
import { Badge, SearchField, Text, useTheme } from '@medfind/ui/native';
import {
  distanceKm,
  findPharmacy,
  formatKm,
  inventory,
  LOW_STOCK_THRESHOLD,
  medicineName,
  openingLabel,
  searchMedicine,
} from '../features/demo/data';
import { TabScreen, Thumb } from '../features/demo/parts';
import { toggleSavedMedicine, useSavedMedicines } from '../features/demo/saved';
import { Button } from '@medfind/ui/native';

type Filter = 'distance' | 'price' | 'delivery';
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'distance', label: 'Distance' },
  { key: 'price', label: 'Price' },
  { key: 'delivery', label: 'Delivery' },
];

/** Search – results (Figma 115:671): pharmacies near the customer that stock the medicine. */
export default function SearchResults() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [submitted, setSubmitted] = useState(params.q ?? '');
  const [filter, setFilter] = useState<Filter>('distance');
  const medicine = searchMedicine(submitted);
  const saved = useSavedMedicines();

  const results = useMemo(() => {
    if (!medicine) return [];
    const rows = inventory
      .filter((i) => i.medicineId === medicine.id && i.quantityInStock > 0)
      .map((i) => {
        const pharmacy = findPharmacy(i.pharmacyId);
        return { inv: i, pharmacy, km: distanceKm(pharmacy) };
      })
      .filter((r) => filter !== 'delivery' || r.pharmacy.offersDelivery);
    return rows.sort((a, b) => (filter === 'price' ? a.inv.priceKobo - b.inv.priceKobo : a.km - b.km));
  }, [medicine, filter]);

  return (
    <TabScreen tab="home">
      <ScrollView contentContainerStyle={styles.content}>
        <SearchField value={query} onChangeText={setQuery} onSubmit={() => setSubmitted(query)} placeholder="Search medicines" />
        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const on = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, { backgroundColor: on ? colors.brand.default : colors.chip.bg }]}
              >
                <Text variant="label2" style={{ color: on ? colors.text.onBrand : colors.chip.text }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {medicine && (
          <Text variant="caption1" color="secondary">
            {results.length} results for:{' '}
            <Text variant="label1" color="heading">
              {medicineName(medicine)}
            </Text>
          </Text>
        )}
        {!medicine && submitted.trim() !== '' && <Text variant="body2" color="secondary">No medicines found. Try another name.</Text>}
        {medicine && <Button label={saved.includes(medicine.id) ? 'Remove from saved' : 'Save medicine'} variant="outline" fullWidth onPress={() => toggleSavedMedicine(medicine.id)} />}
        {results.map(({ inv, pharmacy, km }) => (
          <Pressable
            key={inv.id}
            onPress={() => router.push({ pathname: '/reserve', params: { inventory: inv.id } })}
            style={[styles.card, { backgroundColor: colors.surface.raised }]}
          >
            <Thumb icon="store" size={82} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text variant="h4" style={styles.flex}>
                  {pharmacy.name}
                </Text>
                <Text variant="h4">{formatNaira(inv.priceKobo)}</Text>
              </View>
              <Text variant="caption1" color="secondary">
                {formatKm(km)} · {openingLabel(pharmacy)}
              </Text>
              <View style={styles.badge}>
                {inv.quantityInStock <= LOW_STOCK_THRESHOLD ? (
                  <Badge label="Low stock" tone="warning" />
                ) : (
                  <Badge label="High stock" tone="success" />
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.md, gap: space.md },
  chips: { flexDirection: 'row', gap: space.xs },
  chip: { paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radii.lg },
  card: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl },
  cardBody: { flex: 1, gap: space.xs },
  cardTop: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
  badge: { flexDirection: 'row' },
});
