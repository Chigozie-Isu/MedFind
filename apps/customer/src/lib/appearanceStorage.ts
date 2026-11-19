import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppearancePreference } from '@medfind/ui/native';

const KEY = 'medfind.appearance';

/** The saved Settings > Appearance choice, or 'system' if none or unreadable. */
export async function loadAppearance(): Promise<AppearancePreference> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function saveAppearance(p: AppearancePreference): void {
  AsyncStorage.setItem(KEY, p).catch(() => {
    // Storage unavailable: the choice lasts until the app closes.
  });
}
