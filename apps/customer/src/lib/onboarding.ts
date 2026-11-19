import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'medfind.onboardingSeen';

/** Whether this device has been through Onboarding 1 to 3 (or skipped it). */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Not fatal: onboarding shows again next launch.
  }
}
