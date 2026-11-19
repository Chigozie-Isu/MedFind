import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { ThemeProvider, useTheme, type AppearancePreference } from '@medfind/ui/native';
import { loadAppearance, saveAppearance } from '../lib/appearanceStorage';
import { hydrateAccount } from '../features/demo/account';
import { hydrateReservations } from '../features/demo/store';

function ThemedRoot() {
  const { colors, scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.default }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });
  const [appearance, setAppearance] = useState<AppearancePreference | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  useEffect(() => {
    loadAppearance().then(setAppearance);
    Promise.all([hydrateAccount(), hydrateReservations()]).finally(() => setAccountReady(true));
  }, []);
  if (!fontsLoaded || !appearance || !accountReady) return null;

  return (
    <ThemeProvider initialPreference={appearance} onPreferenceChange={saveAppearance}>
      <ThemedRoot />
    </ThemeProvider>
  );
}
