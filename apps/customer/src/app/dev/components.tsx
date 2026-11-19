import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space } from '@medfind/ui';
import { Tag, Text, ThemeProvider } from '@medfind/ui/native';
import { Showcase } from '../../dev/Showcase';

type Mode = 'both' | 'light' | 'dark';

/**
 * Hidden Components screen: every shared component in light and dark, to
 * compare with Figma. Not linked from anywhere; open /dev/components.
 */
export default function ComponentsScreen() {
  const [mode, setMode] = useState<Mode>('both');
  const { width } = useWindowDimensions();
  const sideBySide = mode === 'both' && width >= 760;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Components</Text>
        <View style={styles.tabs}>
          <Tag label="Light + dark" active={mode === 'both'} onPress={() => setMode('both')} />
          <Tag label="Light" active={mode === 'light'} onPress={() => setMode('light')} />
          <Tag label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} />
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, sideBySide && styles.row]}>
        {mode !== 'dark' && (
          <ThemeProvider forceScheme="light">
            <Showcase />
          </ThemeProvider>
        )}
        {mode !== 'light' && (
          <ThemeProvider forceScheme="dark">
            <Showcase />
          </ThemeProvider>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: space.md, gap: space.sm },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  content: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
