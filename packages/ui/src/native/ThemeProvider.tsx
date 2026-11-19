import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type ColorScheme, type ThemeColors } from '../theme.ts';

/** What the customer picked in Settings > Appearance. */
export type AppearancePreference = 'system' | ColorScheme;

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
}

interface AppearanceValue {
  preference: AppearancePreference;
  setPreference: (p: AppearancePreference) => void;
}

const ThemeContext = createContext<Theme | null>(null);
const AppearanceContext = createContext<AppearanceValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Force light or dark for this subtree (used by the Components screen). */
  forceScheme?: ColorScheme;
  /** Starting appearance for the root provider. */
  initialPreference?: AppearancePreference;
  /** Called when the customer changes Settings > Appearance, e.g. to persist it. */
  onPreferenceChange?: (p: AppearancePreference) => void;
}

export function ThemeProvider({
  children,
  forceScheme,
  initialPreference = 'system',
  onPreferenceChange,
}: ThemeProviderProps) {
  const parent = useContext(AppearanceContext);
  const [ownPreference, setOwnPreference] = useState<AppearancePreference>(initialPreference);
  const system = useColorScheme();

  const appearance = useMemo<AppearanceValue>(
    () =>
      parent ?? {
        preference: ownPreference,
        setPreference: (p) => {
          setOwnPreference(p);
          onPreferenceChange?.(p);
        },
      },
    [parent, ownPreference, onPreferenceChange],
  );

  const scheme: ColorScheme =
    forceScheme ??
    (appearance.preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance.preference);

  const theme = useMemo<Theme>(() => ({ scheme, colors: themes[scheme] }), [scheme]);

  return (
    <AppearanceContext.Provider value={appearance}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </AppearanceContext.Provider>
  );
}

/** Current colours and scheme. Falls back to light outside a provider. */
export function useTheme(): Theme {
  return useContext(ThemeContext) ?? { scheme: 'light', colors: themes.light };
}

/** Read and change Settings > Appearance (System, Light, Dark). */
export function useAppearance(): AppearanceValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside <ThemeProvider>');
  return value;
}
