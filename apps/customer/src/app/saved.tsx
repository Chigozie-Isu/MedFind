import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { space } from '@medfind/ui';
import { Button, Text } from '@medfind/ui/native';
import { medicines } from '../features/demo/data';
import { TabScreen } from '../features/demo/parts';
import { toggleSavedMedicine, useSavedMedicines } from '../features/demo/saved';

export default function SavedMedicines() {
  const saved = useSavedMedicines();
  const items = medicines.filter((medicine) => saved.includes(medicine.id));
  return (
    <TabScreen tab="saved">
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h1">Saved medicines</Text>
        <Text variant="body2" color="secondary">Keep medicines here to find pharmacies again quickly.</Text>
        {items.length === 0 ? (
          <View style={styles.group}>
            <Text variant="h4">No saved medicines yet</Text>
            <Text variant="body2" color="secondary">Search for a medicine and tap Save to add it here.</Text>
            <Button label="Find medicines" fullWidth onPress={() => router.push('/search')} />
          </View>
        ) : items.map((medicine) => (
          <View key={medicine.id} style={styles.group}>
            <Text variant="h4">{medicine.name}</Text>
            <Button label="Find pharmacies" fullWidth onPress={() => router.push({ pathname: '/search', params: { q: medicine.short } })} />
            <Button label="Remove from saved" variant="text" fullWidth onPress={() => toggleSavedMedicine(medicine.id)} />
          </View>
        ))}
      </ScrollView>
    </TabScreen>
  );
}
const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.lg },
  group: { padding: space.md, gap: space.md },
});
