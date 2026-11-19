import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { formatNaira } from '@medfind/core';
import { radii, sizes, space } from '@medfind/ui';
import { Badge, Icon, SearchField, Text, useTheme } from '@medfind/ui/native';
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
import { rememberSearch, useAccount } from '../features/demo/account';
import { LinkRow, Pill, Sheet, SkeletonRow, kit } from '../features/demo/kit';

type FilterKey = 'distance' | 'price' | 'open' | 'delivery' | 'hours';
type Distance = '3' | '5' | '20' | 'any';

const DISTANCES: Array<{ key: Distance; label: string; max: number }> = [
  { key: '3', label: '3km', max: 3 },
  { key: '5', label: '3.1-5km', max: 5 },
  { key: '20', label: '5.1km-20km', max: 20 },
  { key: 'any', label: '20km +', max: Infinity },
];

/**
 * Search (Figma section "Search"): start, loading results, results (115:671), not stocked
 * nearby, medicine not found, and the filter overlays (Distance, Price, Open now, Delivery, Open).
 */
export default function Search() {
  const { colors } = useTheme();
  const account = useAccount();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [submitted, setSubmitted] = useState(params.q ?? '');
  const [loading, setLoading] = useState(!!params.q);
  const [sheet, setSheet] = useState<FilterKey | null>(null);
  const [distance, setDistance] = useState<Distance>('5');
  const [price, setPrice] = useState<'low' | 'high' | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const medicine = searchMedicine(submitted);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [loading, submitted]);

  const submit = (q: string) => {
    setQuery(q);
    setSubmitted(q);
    if (q.trim()) {
      rememberSearch(q);
      setLoading(true);
    }
  };

  const maxKm = DISTANCES.find((d) => d.key === distance)!.max;
  const results = useMemo(() => {
    if (!medicine) return [];
    const rows = inventory
      .filter((i) => i.medicineId === medicine.id && i.quantityInStock > 0)
      .map((i) => ({ inv: i, pharmacy: findPharmacy(i.pharmacyId), km: distanceKm(findPharmacy(i.pharmacyId)) }))
      .filter((r) => r.km <= maxKm)
      .filter((r) => !delivery || r.pharmacy.offersDelivery)
      .filter((r) => !allDay || r.pharmacy.open24Hours);
    return rows.sort((a, b) =>
      price === 'low' ? a.inv.priceKobo - b.inv.priceKobo : price === 'high' ? b.inv.priceKobo - a.inv.priceKobo : a.km - b.km,
    );
  }, [medicine, maxKm, delivery, allDay, price]);

  const chips: Array<{ key: FilterKey; label: string; on: boolean }> = [
    { key: 'distance', label: DISTANCES.find((d) => d.key === distance)!.label, on: true },
    { key: 'price', label: price === 'low' ? 'Low to High' : price === 'high' ? 'High to Low' : 'Price', on: !!price },
    { key: 'open', label: 'Open now', on: openNow },
    { key: 'delivery', label: 'Delivery', on: delivery },
    { key: 'hours', label: allDay ? '24 hours' : 'Open', on: allDay },
  ];

  const option = (label: string, selected: boolean, onPress: () => void) => (
    <Pill key={label} label={label} selected={selected} onPress={() => (onPress(), setSheet(null))} />
  );

  return (
    <TabScreen tab="home">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={kit.row}>
          <Pressable onPress={() => router.navigate('/')} accessibilityRole="button" accessibilityLabel="Back" hitSlop={space.sm}>
            <Icon name="chevron-left" size={sizes.icon.lg} color={colors.text.brand} />
          </Pressable>
          <View style={styles.flex}>
            <SearchField value={query} onChangeText={setQuery} onSubmit={() => submit(query)} placeholder="Search medicines" />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setSheet(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: c.on }}
              style={[styles.chip, { backgroundColor: c.on ? colors.brand.default : colors.chip.bg }]}
            >
              <Text variant="label2" style={{ color: c.on ? colors.text.onBrand : colors.chip.text }}>
                {c.label}
              </Text>
              <Icon name="chevron-down" size={sizes.icon.sm} color={c.on ? colors.text.onBrand : colors.chip.text} />
            </Pressable>
          ))}
        </ScrollView>

        {!submitted.trim() ? (
          <View style={styles.start}>
            <Icon name="search" size={48} color={colors.text.tertiary} />
            <Text variant="h3">Search for medication</Text>
            <Text variant="body3" color="secondary" style={kit.center}>
              Search for medication using brand name, generic name or picture
            </Text>
            {account.recentSearches.length > 0 && (
              <View style={kit.wrap}>
                {account.recentSearches.map((t) => (
                  <Pill key={t} label={t} onPress={() => submit(t)} />
                ))}
              </View>
            )}
          </View>
        ) : loading ? (
          <View style={styles.list}>
            <Text variant="caption1" color="secondary">
              Searching pharmacies near you…
            </Text>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : !medicine ? (
          <View style={styles.list}>
            <Text variant="h2">We couldn’t find “{submitted}”</Text>
            <Text variant="body3" color="secondary">
              It may be spelt differently, or it may not be sold in Nigeria yet.
            </Text>
            <Text variant="h5">What you can do</Text>
            <LinkRow icon="search" title="Check the spelling or try the generic name" onPress={() => submit('')} />
            <LinkRow icon="upload" title="Upload a prescription and we’ll match it for you" onPress={() => submit('Augmentin')} />
          </View>
        ) : results.length === 0 ? (
          <View style={styles.list}>
            <Text variant="caption1" color="secondary">
              0 results for {medicineName(medicine)} within {DISTANCES.find((d) => d.key === distance)!.label}
            </Text>
            <Text variant="h2">No pharmacy near you has it</Text>
            <Text variant="body3" color="secondary">
              We checked the pharmacies within {DISTANCES.find((d) => d.key === distance)!.label} of 24 Aba Road.
            </Text>
            <Text variant="h5">Things to try</Text>
            <LinkRow
              icon="location"
              title="Search further away"
              subtitle="Include pharmacies up to 20 km"
              onPress={() => (setDistance('20'), setDelivery(false), setAllDay(false), setOpenNow(false))}
            />
            <LinkRow
              icon="notification"
              title="Tell me when it’s in stock"
              onPress={() => router.push({ pathname: '/stock-alert', params: { medicine: medicine.id } })}
            />
          </View>
        ) : (
          <View style={styles.list}>
            <Text variant="caption1" color="secondary">
              {results.length} results for:{' '}
              <Text variant="label1" color="heading">
                {medicineName(medicine)}
              </Text>
            </Text>
            {results.map(({ inv, pharmacy, km }) => (
              <Pressable
                key={inv.id}
                onPress={() => router.push({ pathname: '/reserve', params: { inventory: inv.id } })}
                accessibilityRole="button"
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
                  <View style={kit.row}>
                    {inv.quantityInStock <= LOW_STOCK_THRESHOLD ? (
                      <Badge label="Low stock" tone="warning" />
                    ) : (
                      <Badge label="High stock" tone="success" />
                    )}
                    {pharmacy.offersDelivery && <Badge label="Delivery" tone="info" />}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={sheet !== null} onClose={() => setSheet(null)}>
        <Text variant="h3">
          {sheet === 'distance' ? 'Distance' : sheet === 'price' ? 'Price' : sheet === 'open' ? 'Open now' : sheet === 'delivery' ? 'Delivery' : 'Open'}
        </Text>
        <View style={kit.wrap}>
          {sheet === 'distance' && DISTANCES.map((d) => option(d.label, distance === d.key, () => setDistance(d.key)))}
          {sheet === 'price' && [option('High to Low', price === 'high', () => setPrice('high')), option('Low to High', price === 'low', () => setPrice('low'))]}
          {sheet === 'open' && [option('Open now', openNow, () => setOpenNow(true)), option('All', !openNow, () => setOpenNow(false))]}
          {sheet === 'delivery' && [option('Delivery', delivery, () => setDelivery(true)), option('All', !delivery, () => setDelivery(false))]}
          {sheet === 'hours' && [option('All', !allDay, () => setAllDay(false)), option('24 hours', allDay, () => setAllDay(true))]}
        </View>
      </Sheet>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.md, gap: space.md },
  chips: { gap: space.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.xxs, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radii.lg },
  start: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  list: { gap: space.md },
  card: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radii.xl },
  cardBody: { flex: 1, gap: space.xs },
  cardTop: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
});
