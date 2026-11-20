import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Which version of the app's code is running, shown at the bottom of Settings so a tester can
 * tell whether the installed app has picked up the latest update ("Update 20 Nov, 11:44").
 */
export function appVersionLabel(): string {
  if (Platform.OS === 'web') return 'Web version';
  try {
    if (!Updates.isEnabled) return 'Development build';
    if (Updates.isEmbeddedLaunch || !Updates.createdAt) return 'Built-in version (no update loaded yet)';
    const d = Updates.createdAt;
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `Update ${date}, ${time}`;
  } catch {
    return '';
  }
}
