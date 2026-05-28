import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';
import type { ResolvedThemeMode, ThemeMode, TradeIQTheme } from './theme';

type ThemeContextValue = {
  theme: TradeIQTheme;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const storageKey = 'tradeiq.theme.mode';

function resolveMode(mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedThemeMode {
  if (mode === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'dark');

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(savedMode => {
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(storageKey, nextMode);
  };

  const resolvedMode = resolveMode(mode, systemScheme);
  const theme = resolvedMode === 'light' ? lightTheme : darkTheme;

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setMode }),
    [mode, resolvedMode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
