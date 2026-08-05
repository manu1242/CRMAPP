import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

const THEME_KEY = '@app_theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  theme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativeWindColorScheme();
  
  // Default to system preference
  const systemScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  // Sync theme with NativeWind and Appearance on state change
  useEffect(() => {
    // Sync with React Native system if supported
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(theme);
    }
    // Sync with NativeWind
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') {
          setTheme(saved);
        }
      })
      .catch((err) => {
        console.error('[ThemeContext] Error loading theme:', err);
      });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next).catch((err) => {
        console.error('[ThemeContext] Error saving theme:', err);
      });
      return next;
    });
  }, []);

  const isDark = theme === 'dark';

  const contextValue = useMemo(
    () => ({ isDark, toggleTheme, theme }),
    [isDark, toggleTheme, theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
