import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space } from '@medfind/ui';
import { Button, OptionList, Text, useAppearance, type AppearancePreference } from '@medfind/ui/native';

/** Settings > Appearance: System, Light or Dark. */
export default function AppearanceSettings() {
  const { preference, setPreference } = useAppearance();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Button icon="chevron-left" variant="text" size="large" onPress={() => router.back()} accessibilityLabel="Back" />
        <Text variant="h3">Appearance</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <OptionList
          value={preference}
          onChange={(v) => setPreference(v as AppearancePreference)}
          options={[
            { value: 'system', title: 'System', description: 'Match your phone’s setting' },
            { value: 'light', title: 'Light' },
            { value: 'dark', title: 'Dark' },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  content: { padding: space.md },
});
