import React from 'react';
import { Box, Text } from 'ink';
import { useThemeStyles } from '../theme';
import { OverlayConfig, getBuiltInOverlay } from './overlays';

interface StatusBarProps {
  sessionName?: string;
  model: string;
  effort: string;
  permMode: string;
  isProcessing: boolean;
  config: any;
  theme: ReturnType<typeof useThemeStyles>;
  tokenEstimate?: number;
  compactThreshold?: number;
  mcpConnected?: boolean;
  gitBranch?: string;
}

export function StatusBar({
  sessionName,
  model,
  effort,
  permMode,
  isProcessing,
  config,
  theme,
  tokenEstimate = 0,
  compactThreshold = 160000,
  mcpConnected = false,
  gitBranch,
}: StatusBarProps) {
  const contextPercent = compactThreshold > 0 ? Math.round((tokenEstimate / compactThreshold) * 100) : 0;

  // Get enabled overlays from config
  const overlays = config.statusBar?.overlays || [];
  const enabledBuiltIns = config.statusBar?.builtIn || ['model', 'context', 'perms', 'mcp', 'tokens', 'git'];

  const leftItems: React.ReactNode[] = [];
  const centerItems: React.ReactNode[] = [];
  const rightItems: React.ReactNode[] = [];

  // Built-in overlays
  if (enabledBuiltIns.includes('model')) {
    leftItems.push(
      <Box key="model" flexDirection="row" marginRight={2}>
        <Text color={theme.primary} bold>⚡</Text>
        <Text color={theme.text}>{model}</Text>
      </Box>
    );
  }
  if (enabledBuiltIns.includes('context')) {
    const contextColor = contextPercent > 80 ? theme.warning : contextPercent > 60 ? theme.primary : theme.success;
    leftItems.push(
      <Box key="context" flexDirection="row" marginRight={2}>
        <Text color={theme.textMuted}>ctx:</Text>
        <Text color={contextColor} bold>{contextPercent}%</Text>
      </Box>
    );
  }
  if (enabledBuiltIns.includes('perms')) {
    leftItems.push(
      <Box key="perms" flexDirection="row" marginRight={2}>
        <Text color={theme.textMuted}>perm:</Text>
        <Text color={theme.primary} bold>{permMode}</Text>
      </Box>
    );
  }
  if (enabledBuiltIns.includes('mcp')) {
    leftItems.push(
      <Box key="mcp" flexDirection="row" marginRight={2}>
        <Text color={mcpConnected ? theme.success : theme.textMuted}>
          {mcpConnected ? '●' : '○'} MCP
        </Text>
      </Box>
    );
  }
  if (enabledBuiltIns.includes('tokens')) {
    leftItems.push(
      <Box key="tokens" flexDirection="row" marginRight={2}>
        <Text color={theme.textMuted}>≈</Text>
        <Text color={theme.text}>{tokenEstimate.toLocaleString()} tok</Text>
      </Box>
    );
  }
  if (enabledBuiltIns.includes('git') && gitBranch) {
    leftItems.push(
      <Box key="git" flexDirection="row" marginRight={2}>
        <Text color={theme.primary} bold></Text>
        <Text color={theme.text}>{gitBranch}</Text>
      </Box>
    );
  }

  // Custom overlays from config
  for (const overlay of overlays) {
    const item = getBuiltInOverlay(overlay.id, theme, overlay.props);
    if (item) {
      const target = overlay.position === 'center' ? centerItems : overlay.position === 'right' ? rightItems : leftItems;
      target.push(<Box key={overlay.id} marginRight={2}>{item}</Box>);
    }
  }

  return (
    <Box borderStyle="single" borderColor={theme.border} paddingX={1} paddingY={0}>
      <Box flexDirection="row" width="100%">
        <Box flexDirection="row" width="33%">
          {sessionName && <Text key="session" color={theme.primary} bold>[ {sessionName} ] </Text>}
          {leftItems}
        </Box>
        <Box flexDirection="row" width="34%" justifyContent="center">
          {centerItems.length > 0 && centerItems}
        </Box>
        <Box flexDirection="row" width="33%" justifyContent="flex-end">
          {isProcessing && <Text key="processing" color={theme.warning} bold> ◐ processing </Text>}
          {rightItems}
          <Text key="hints" color={theme.textMuted}>
            Shift+Tab=perm | Enter=interrupt | Alt+Enter=follow-up | Shift+Enter=newline
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export { OverlayConfig } from './overlays';