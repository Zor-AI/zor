export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemePalette {
  // Base colors
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Accent / primary
  primary: string;
  primaryHover: string;
  primaryText: string;
  
  // Borders
  border: string;
  borderFocus: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Message roles
  userMsg: string;
  assistantMsg: string;
  toolMsg: string;
  toolResultMsg: string;
  systemMsg: string;
  
  // Diff
  diffAdd: string;
  diffRemove: string;
  
  // UI elements
  cursor: string;
  selection: string;
  scrollbar: string;
  scrollbarHover: string;
}

export const lightTheme: ThemePalette = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceElevated: '#ffffff',
  
  text: '#1a1a2e',
  textSecondary: '#4a4a6a',
  textMuted: '#8888a0',
  textInverse: '#ffffff',
  
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  primaryText: '#ffffff',
  
  border: '#e0e0e8',
  borderFocus: '#6366f1',
  
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  userMsg: '#06b6d4',
  assistantMsg: '#10b981',
  toolMsg: '#f59e0b',
  toolResultMsg: '#6b7280',
  systemMsg: '#ef4444',
  
  diffAdd: '#dcfce7',
  diffRemove: '#fee2e2',
  
  cursor: '#6366f1',
  selection: 'rgba(99, 102, 241, 0.2)',
  scrollbar: '#d0d0d8',
  scrollbarHover: '#a0a0b0',
};

export const darkTheme: ThemePalette = {
  background: '#0d0d12',
  surface: '#16161d',
  surfaceElevated: '#1e1e28',
  
  text: '#f0f0f5',
  textSecondary: '#b0b0c0',
  textMuted: '#707088',
  textInverse: '#0d0d12',
  
  primary: '#818cf8',
  primaryHover: '#a5adff',
  primaryText: '#0d0d12',
  
  border: '#2a2a3a',
  borderFocus: '#818cf8',
  
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  userMsg: '#22d3ee',
  assistantMsg: '#4ade80',
  toolMsg: '#fbbf24',
  toolResultMsg: '#9ca3af',
  systemMsg: '#f87171',
  
  diffAdd: '#14532d',
  diffRemove: '#7f1d1d',
  
  cursor: '#818cf8',
  selection: 'rgba(129, 140, 248, 0.3)',
  scrollbar: '#3a3a4a',
  scrollbarHover: '#505060',
};

export const autoTheme: ThemePalette = darkTheme; // Fallback; resolved at runtime