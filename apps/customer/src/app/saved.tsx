import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radii, space } from '@medfind/ui';
import { Badge, Button, Text, useTheme } from '@medfind/ui/native';
import { findInventory, findMedicine, findPharmacy } from '../features/demo/data';
import { TabScreen, Thumb } from '../features/demo/parts';
import { useAccount } from '../features/demo/account';
import { useReservations } from '../features/demo/store';
import { EmptyState, SkeletonRow, useBriefLoading } from '../features/demo/kit';

const shortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

/** Saved and refills (Figma 159:1962) and its empty state (2185:14033). */
export default function Saved() {
  const { colors } = useTheme();
  const account = useAccount();
  const all = useReservations();
  const [tab, setTab] = useState<'saved' | 'refills'>('saved');
  const loading = useBriefLoading(500);

  // Refills: saved medicines you've collected before, newest first.
  const refills = account.saved.filter((s) => all.some((r) => r.medicineId === s.medicineId && r.status === 'collected'));
  const list = tab === 'saved' ? account.saved : refills;

  return (
    <TabScreen tab="saved">
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text variant="h1">Saved</Text>
          <Text variant="caption1" color="secondary">
            Medications you saved for quick access.
          </Text>
        </View>
        <View style={styles.tabs} accessibilityRole="tablist">
          {(['saved', 'refills'] as const).map((t) => {
            const on = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, on && { backgroundColor: colors.brand.default }]}
              >
                <Text variant="body2" style={{ color: on ? colors.text.onBrand : colors.text.body }}>
                  {t === 'saved' ? 'Saved' : 'Refills'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === 'saved' ? 'No saved medications yet' : 'No refills due'}
            body={
              tab === 'saved'
                ? 'When you save a medicine, it will show up here.'
                : 'Medicines you save and collect show up here when it’s time to restock.'
            }
            action="Search for medicine"
            onAction={() => router.push('/search')}
          />
        ) : (
          list.map((s) => {
            const inv = findInventory(s.inventoryId);
            const med = findMedicine(s.medicineId);
            const last = all.find((r) => r.medicineId === s.medicineId && r.status === 'collected');
            return (
              <View key={s.medicineId} style={[styles.row, { backgroundColor: colors.surface.raised }]}>
                <Thumb medicineId={med.id} />
                <View style={styles.body}>
                  <View style={styles.top}>
                    <Text variant="h5" style={styles.flex} numberOfLines={1}>
                      {med.name}
                    </Text>
                    {last ? <Badge label="Collected" tone="success" dot="left" /> : <Badge label="Saved" tone="info" dot="left" />}
                  </View>
                  <Text variant="caption1" color="secondary">
                    {findPharmacy(inv.pharmacyId).name}
                  </Text>
                  <View style={styles.top}>
                    <Text variant="caption1" color="tertiary" style={styles.flex}>
                      {shortDate(last?.collectedAt ?? s.savedAt)}
                    </Text>
                    <Button
                      label="Repeat"
                      size="small"
                      iconLeft="history"
                      onPress={() => router.push({ pathname: '/reserve', params: { inventory: inv.id } })}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.md, gap: space.lg },
  tabs: { flexDirection: 'row', gap: space.xs },
  tab: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radii.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.xl },
  body: { flex: 1, gap: space.xs },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
