import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { Theme, ThemePalette, ThemeMode, getTheme, resolveTheme, getThemes } from './registry';
import { lightTheme, darkTheme, autoTheme } from './default';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

interface ThemeProviderProps {
  config: { theme?: ThemeMode };
  children: React.ReactNode;
}

function getPrefersDark(): boolean {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.matchMedia) {
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } catch {}
  return true;
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(config.theme ?? 'auto');
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    setPrefersDark(getPrefersDark());
    try {
      const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
      if (mediaQuery?.addEventListener) {
        const handler = (e: any) => setPrefersDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (config.theme && config.theme !== mode) setModeState(config.theme);
  }, [config.theme, mode]);

  const theme = useMemo(() => resolveTheme(mode, prefersDark), [mode, prefersDark]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const value = useMemo(() => ({
    theme,
    mode,
    setMode,
    availableThemes: getThemes(),
  }), [theme, mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeStyles(): ThemePalette {
  return useTheme().theme.palette;
}

export { Theme, ThemePalette, ThemeMode, getTheme, getThemes, resolveTheme } from './registry';
export { lightTheme, darkTheme, autoTheme } from './default';