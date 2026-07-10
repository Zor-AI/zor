export type ThemeMode = 'light' | 'dark' | 'auto' | 'custom';

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderFocus: string;
  selection: string;
  userMsg: string;
  assistantMsg: string;
  toolMsg: string;
  toolResultMsg: string;
  systemMsg: string;
  diffAdd: string;
  diffRemove: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  warning: string;
  success: string;
  error: string;
  info: string;
  cursor: string;
  scrollbar: string;
  scrollbarHover: string;
}

export interface Theme {
  name: string;
  palette: ThemePalette;
}

const lightPalette: ThemePalette = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceElevated: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',
  border: '#e5e7eb',
  borderFocus: '#9b59b6',
  selection: '#ede9fe',
  userMsg: '#0891b2',
  assistantMsg: '#16a34a',
  toolMsg: '#ca8a04',
  toolResultMsg: '#6b7280',
  systemMsg: '#dc2626',
  diffAdd: '#dcfce7',
  diffRemove: '#fee2e2',
  primary: '#9b59b6',
  primaryHover: '#8e4ec6',
  primaryText: '#ffffff',
  warning: '#f59e0b',
  success: '#16a34a',
  error: '#dc2626',
  info: '#3b82f6',
  cursor: '#9b59b6',
  scrollbar: '#d1d5db',
  scrollbarHover: '#9ca3af',
};

const darkPalette: ThemePalette = {
  background: '#0d0d0d',
  surface: '#1a1a2e',
  surfaceElevated: '#252540',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0d0d0d',
  border: '#334155',
  borderFocus: '#a78bfa',
  selection: '#312e81',
  userMsg: '#22d3ee',
  assistantMsg: '#4ade80',
  toolMsg: '#fbbf24',
  toolResultMsg: '#94a3b8',
  systemMsg: '#f87171',
  diffAdd: '#052e16',
  diffRemove: '#450a0a',
  primary: '#a78bfa',
  primaryHover: '#c4b5fd',
  primaryText: '#0d0d0d',
  warning: '#fbbf24',
  success: '#4ade80',
  error: '#f87171',
  info: '#60a5fa',
  cursor: '#a78bfa',
  scrollbar: '#475569',
  scrollbarHover: '#64748b',
};

const themes = new Map<string, Theme>([
  ['light', { name: 'light', palette: lightPalette }],
  ['dark', { name: 'dark', palette: darkPalette }],
  ['monokai', { 
    name: 'monokai', 
    palette: {
      ...darkPalette,
      background: '#272822',
      surface: '#2d2e26',
      surfaceElevated: '#383830',
      text: '#f8f8f2',
      textSecondary: '#75715e',
      textMuted: '#666666',
      border: '#49483e',
      borderFocus: '#ae81ff',
      selection: '#49483e',
      userMsg: '#66d9ef',
      assistantMsg: '#a6e22e',
      toolMsg: '#e6db74',
      toolResultMsg: '#75715e',
      systemMsg: '#f92672',
      diffAdd: '#1a3d2e',
      diffRemove: '#3d1a1a',
    }
  }],
  ['solarized-dark', {
    name: 'solarized-dark',
    palette: {
      ...darkPalette,
      background: '#002b36',
      surface: '#073642',
      surfaceElevated: '#0a3c48',
      text: '#839496',
      textSecondary: '#586e75',
      textMuted: '#657b83',
      border: '#073642',
      borderFocus: '#268bd2',
      selection: '#073642',
      userMsg: '#2aa198',
      assistantMsg: '#859900',
      toolMsg: '#b58900',
      toolResultMsg: '#586e75',
      systemMsg: '#dc322f',
      diffAdd: '#0a3a2a',
      diffRemove: '#3a1a1a',
    }
  }],
]);

export function getThemes(): Theme[] {
  return Array.from(themes.values());
}

export function getTheme(name: string): Theme | undefined {
  return themes.get(name.toLowerCase());
}

export function registerTheme(name: string, theme: Theme): void {
  themes.set(name.toLowerCase(), theme);
}

export function listThemes(): string[] {
  return Array.from(themes.keys());
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): Theme {
  if (mode === 'auto') {
    return prefersDark ? themes.get('dark')! : themes.get('light')!;
  }
  if (mode === 'custom') {
    return themes.get('dark')!;
  }
  return themes.get(mode)!;
}