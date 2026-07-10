import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

export type Action = 
  | 'submit'
  | 'newline'
  | 'interrupt'
  | 'followup'
  | 'historyUp'
  | 'historyDown'
  | 'cursorLeft'
  | 'cursorRight'
  | 'cursorHome'
  | 'cursorEnd'
  | 'deleteBackward'
  | 'deleteForward'
  | 'wordLeft'
  | 'wordRight'
  | 'complete'
  | 'cyclePerms'
  | 'undo'
  | 'tab';

export interface KeybindingConfig {
  preset?: 'default' | 'vim' | 'emacs';
  bindings?: Record<string, string | string[]>;
  path?: string;
}

export interface KeybindingPreset {
  name: string;
  bindings: Record<Action, string[]>;
}

function expandPath(p: string): string {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return resolve(p);
}

export const DEFAULT_KEYBINDINGS: Record<Action, string[]> = {
  submit: ['Enter'],
  newline: ['Shift+Enter'],
  interrupt: ['Enter'],
  followup: ['Alt+Enter', 'Meta+Enter'],
  historyUp: ['ArrowUp'],
  historyDown: ['ArrowDown'],
  cursorLeft: ['ArrowLeft'],
  cursorRight: ['ArrowRight'],
  cursorHome: ['Home', 'Ctrl+A'],
  cursorEnd: ['End', 'Ctrl+E'],
  deleteBackward: ['Backspace'],
  deleteForward: ['Delete'],
  wordLeft: ['Ctrl+ArrowLeft'],
  wordRight: ['Ctrl+ArrowRight'],
  complete: ['Tab'],
  cyclePerms: ['Shift+Tab'],
  undo: ['Shift+Escape'],
  tab: ['Tab'],
};

export const VIM_KEYBINDINGS: Record<Action, string[]> = {
  submit: ['Enter'],
  newline: ['Shift+Enter'],
  interrupt: ['Ctrl+C'],
  followup: ['Alt+Enter'],
  historyUp: ['ArrowUp', 'Ctrl+P'],
  historyDown: ['ArrowDown', 'Ctrl+N'],
  cursorLeft: ['ArrowLeft', 'h'],
  cursorRight: ['ArrowRight', 'l'],
  cursorHome: ['Home', 'Ctrl+A', '0'],
  cursorEnd: ['End', 'Ctrl+E', '$'],
  deleteBackward: ['Backspace', 'x'],
  deleteForward: ['Delete', 'x'],
  wordLeft: ['Ctrl+ArrowLeft', 'b'],
  wordRight: ['Ctrl+ArrowRight', 'w'],
  complete: ['Tab'],
  cyclePerms: ['Shift+Tab'],
  undo: ['u'],
  tab: ['Tab'],
};

export const EMACS_KEYBINDINGS: Record<Action, string[]> = {
  submit: ['Enter'],
  newline: ['Ctrl+J', 'Ctrl+M'],
  interrupt: ['Ctrl+C'],
  followup: ['Alt+Enter', 'Meta+Enter'],
  historyUp: ['Ctrl+P'],
  historyDown: ['Ctrl+N'],
  cursorLeft: ['Ctrl+B'],
  cursorRight: ['Ctrl+F'],
  cursorHome: ['Ctrl+A'],
  cursorEnd: ['Ctrl+E'],
  deleteBackward: ['Ctrl+H', 'Backspace'],
  deleteForward: ['Ctrl+D'],
  wordLeft: ['Alt+B', 'Meta+B'],
  wordRight: ['Alt+F', 'Meta+F'],
  complete: ['Tab'],
  cyclePerms: ['Shift+Tab'],
  undo: ['Ctrl+_', 'Ctrl+X', 'Ctrl+U'],
  tab: ['Tab'],
};

export const presets: Record<string, KeybindingPreset> = {
  default: { name: 'default', bindings: DEFAULT_KEYBINDINGS },
  vim: { name: 'vim', bindings: VIM_KEYBINDINGS },
  emacs: { name: 'emacs', bindings: EMACS_KEYBINDINGS },
};

export function getPresetBindings(preset: string): Record<Action, string[]> {
  switch (preset) {
    case 'vim': return VIM_KEYBINDINGS;
    case 'emacs': return EMACS_KEYBINDINGS;
    default: return DEFAULT_KEYBINDINGS;
  }
}

export function loadKeybindings(config: KeybindingConfig): Record<Action, string[]> {
  const preset = config.preset || 'default';
  let bindings = { ...getPresetBindings(preset) };

  if (config.bindings) {
    for (const [action, keys] of Object.entries(config.bindings)) {
      if (action in DEFAULT_KEYBINDINGS) {
        bindings[action as Action] = Array.isArray(keys) ? keys : [keys];
      }
    }
  }

  if (config.path) {
    const path = expandPath(config.path);
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        const fileConfig = JSON.parse(content);
        if (fileConfig.bindings) {
          for (const [action, keys] of Object.entries(fileConfig.bindings)) {
            if (action in DEFAULT_KEYBINDINGS) {
              bindings[action as Action] = Array.isArray(keys) ? keys : [keys];
            }
          }
        }
      } catch (e) {
        console.error('Failed to load keybindings:', e);
      }
    }
  }

  return bindings;
}

export function resolveKeybinding(
  input: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; key: string },
  bindings: Record<Action, string[]>
): Action | null {
  const normalized = normalizeKey(input.key);
  
  for (const [action, keys] of Object.entries(bindings)) {
    for (const key of keys) {
      const parts = key.toLowerCase().split('+');
      const expectedCtrl = parts.includes('ctrl');
      const expectedAlt = parts.includes('alt');
      const expectedShift = parts.includes('shift');
      const expectedMeta = parts.includes('meta') || parts.includes('super') || parts.includes('cmd');
      const expectedKey = parts[parts.length - 1];
      
      if (
        input.ctrl === expectedCtrl &&
        input.alt === expectedAlt &&
        input.shift === expectedShift &&
        input.meta === expectedMeta &&
        normalized === expectedKey
      ) {
        return action as Action;
      }
    }
  }
  return null;
}

function normalizeKey(key: string): string {
  return key
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/^ctrl\+/i, 'ctrl+')
    .replace(/^alt\+/i, 'alt+')
    .replace(/^meta\+/i, 'meta+')
    .replace(/^shift\+/i, 'shift+')
    .replace(/^super\+/i, 'meta+')
    .replace(/^command\+/i, 'meta+');
}

export function formatKeybinding(action: Action, bindings: Record<Action, string[]>): string {
  const keys = bindings[action];
  if (!keys || keys.length === 0) return '—';
  return keys.join(' / ');
}