import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { adminThemeTokens, AdminThemeTokens, getAdminTheme } from '../theme/adminTheme';

const THEME_KEY = '@app_theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemePreference = ThemeMode;

export interface ThemeContextType {
  mode: ThemeMode;
  preference: ThemeMode; // Backward compatibility alias
  isDark: boolean;
  theme: 'light' | 'dark';
  colors: AdminThemeTokens;
  setMode: (mode: ThemeMode) => void;
  setPreference: (pref: ThemePreference) => void; // Backward compatibility alias
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  preference: 'system',
  isDark: false,
  theme: 'light',
  colors: adminThemeTokens.light,
  setMode: () => { },
  setPreference: () => { },
  toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1. Direct reactive subscription to the device's native color scheme (iOS & Android)
  // React Native's useColorScheme automatically triggers a re-render the moment the OS theme toggles
  const systemScheme = useRNColorScheme();
  
  // 2. NativeWind's color scheme controller
  const { setColorScheme } = useNativeWindColorScheme();

  // 3. User selected mode ('system' | 'light' | 'dark')
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference from AsyncStorage on startup
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (isMounted) {
          if (saved === 'dark' || saved === 'light' || saved === 'system') {
            setModeState(saved as ThemeMode);
          } else {
            setModeState('system');
          }
        }
      })
      .catch(() => {
        if (isMounted) setModeState('system');
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active theme state:
  // - If mode is 'system', react directly to the live systemScheme from the OS.
  // - If mode is 'dark' or 'light', use the manual choice and ignore OS changes.
  const isDark = mode === 'system' ? (systemScheme === 'dark') : (mode === 'dark');
  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const colors = useMemo(() => getAdminTheme(isDark), [isDark]);

  // Synchronize NativeWind:
  // When in 'system' mode, pass 'system' so NativeWind tracks the OS automatically.
  // When in 'light' or 'dark' mode, pass the manual theme.
  useEffect(() => {
    setColorScheme(mode === 'system' ? 'system' : theme);
  }, [mode, theme, setColorScheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode).catch(() => { });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setMode(pref);
  }, [setMode]);

  const toggleTheme = useCallback(() => {
    // In-app toggle flips the mode between light and dark
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setMode(nextMode);
  }, [isDark, setMode]);

  const contextValue = useMemo(
    () => ({
      mode,
      preference: mode,
      isDark,
      theme,
      colors,
      setMode,
      setPreference,
      toggleTheme,
    }),
    [mode, isDark, theme, colors, setMode, setPreference, toggleTheme]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
