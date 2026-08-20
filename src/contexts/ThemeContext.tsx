import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

const THEME_KEY = '@app_theme';

type ThemeMode = 'light' | 'dark';
type ThemePreference = 'system' | ThemeMode;

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeMode;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: 'light',
  preference: 'system',
  setPreference: () => { },
  toggleTheme: () => { },
});

function getSystemTheme(): ThemeMode {
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativeWindColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setPreferenceState(saved as ThemePreference);
        }
      })
      .catch(() => { })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Listen for OS-level theme changes (always active, so system preference works)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => {
      subscription?.remove();
    };
  }, []);

  // Resolve the actual theme from preference + system
  const theme: ThemeMode = preference === 'system' ? systemTheme : preference;
  const isDark = theme === 'dark';

  // Sync with NativeWind and Appearance
  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(theme);
    }
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => { });
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      // If on system, toggle to the opposite of current system theme
      const current = prev === 'system' ? getSystemTheme() : prev;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next).catch(() => { });
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ isDark, theme, preference, setPreference, toggleTheme }),
    [isDark, theme, preference, setPreference, toggleTheme]
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
