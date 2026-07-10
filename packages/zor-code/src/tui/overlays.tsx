import React from 'react';
import { Box, Text } from 'ink';
import type { ThemePalette } from '../theme';

export interface OverlayConfig {
  id: string;
  position: 'left' | 'center' | 'right';
  component: string;
  props?: Record<string, any>;
}

export const builtInOverlays: Record<string, (theme: ThemePalette, props?: any) => React.ReactNode> = {
  clock: (theme) => (
    <Text color={theme.textMuted}>
      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  ),
  memory: (theme) => {
    const used = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    return <Text color={used > 500 ? theme.warning : theme.text}>{used}MB</Text>;
  },
  version: (theme) => <Text color={theme.textMuted}>v0.1.0</Text>,
  custom: (theme, props) => <Text color={theme.primary}>{props?.text || 'custom'}</Text>,
};

export function getBuiltInOverlay(id: string, theme: ThemePalette, props?: any): React.ReactNode {
  return builtInOverlays[id]?.(theme, props) || null;
}