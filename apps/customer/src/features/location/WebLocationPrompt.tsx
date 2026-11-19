import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { radii, space } from '@medfind/ui';
import { Icon, Text, useTheme } from '@medfind/ui/native';
import { onWebLocationPrompt } from '../../lib/deviceLocation';

/**
 * The phone's location prompt, drawn for the web demo (Figma "Location – system prompt",
 * 2678:160797). On a real phone the system shows its own prompt and this renders nothing.
 */
export function WebLocationPrompt() {
  const { colors } = useTheme();
  const [resolve, setResolve] = useState<((allowed: boolean) => void) | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    onWebLocationPrompt((r) => setResolve(() => r));
    return () => onWebLocationPrompt(null);
  }, []);
  if (!resolve) return null;
  const answer = (allowed: boolean) => {
    resolve(allowed);
    setResolve(null);
  };
  const option = (label: string, allowed: boolean, last?: boolean) => (
    <Pressable
      onPress={() => answer(allowed)}
      accessibilityRole="button"
      style={[styles.option, !last && { borderBottomWidth: 1, borderBottomColor: colors.surface.border }]}
    >
      <Text variant="body2" color="brand">
        {label}
      </Text>
    </Pressable>
  );
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => answer(false)}>
      <View style={styles.dim}>
        <View style={[styles.box, { backgroundColor: colors.surface.raised }]} accessibilityRole="alert">
          <View style={styles.head}>
            <Text variant="h5" style={styles.center}>
              Allow “MedFind” to use your location?
            </Text>
            <Text variant="caption1" color="secondary" style={styles.center}>
              MedFind uses your location to show pharmacies near you that have your medicine.
            </Text>
          </View>
          <View style={[styles.map, { backgroundColor: colors.surface.muted }]}>
            <Text variant="caption2" color="brand" style={styles.precise}>
              Precise: On
            </Text>
            <Icon name="location" size={28} color={colors.mapMarker} />
          </View>
          {option('Allow Once', true)}
          {option('Allow While Using App', true)}
          {option('Don’t Allow', false, true)}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0, 9, 20, 0.45)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  box: { width: 270, borderRadius: radii.md, overflow: 'hidden' },
  head: { padding: space.md, gap: space.xxs },
  center: { textAlign: 'center' },
  map: { height: 100, marginHorizontal: space.md, marginBottom: space.md, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  precise: { position: 'absolute', top: space.xs, left: space.xs },
  option: { paddingVertical: space.sm, alignItems: 'center' },
});
