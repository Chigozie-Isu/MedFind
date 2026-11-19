import { OptionList, Text, type AppearancePreference, useAppearance } from '@medfind/ui/native';
import { Screen } from '../../features/demo/kit';

/** Settings – appearance (Figma 2034:20411): Light, Dark or Match my phone. */
export default function AppearanceSettings() {
  const { preference, setPreference } = useAppearance();
  return (
    <Screen title="Appearance">
      <Text variant="label1" color="secondary">
        Theme
      </Text>
      <OptionList
        value={preference}
        onChange={(v) => setPreference(v as AppearancePreference)}
        options={[
          { value: 'light', title: 'Light', description: 'Always use the light theme', icon: 'sun' },
          { value: 'dark', title: 'Dark', description: 'Easier on the eyes at night', icon: 'moon' },
          { value: 'system', title: 'Match my phone', description: 'Switches with your phone’s setting', icon: 'setting' },
        ]}
      />
    </Screen>
  );
}
