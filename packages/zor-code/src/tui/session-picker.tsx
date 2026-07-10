import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useThemeStyles } from '../theme';

interface SessionRow {
  id: string;
  name?: string;
  display: string;
  ago: string;
  msgCount: number;
  cwd: string;
  onSelect: (id: string) => void;
}

function SessionPickerRow({ session, isSelected }: { session: SessionRow; isSelected: boolean }) {
  const theme = useThemeStyles();
  const prefix = isSelected ? '>' : ' ';
  return (
    <Box>
      <Text color={isSelected ? theme.primary : theme.text}>
        {prefix} {session.display.padEnd(50).slice(0, 50)}
      </Text>
      <Text color={theme.textMuted}> {String(session.msgCount).padStart(4)} msgs</Text>
      <Text color={theme.textMuted}>  {session.ago}</Text>
    </Box>
  );
}

export function SessionPicker({
  sessions,
  onSelect,
  onCancel,
}: {
  sessions: Array<{ id: string; name?: string; messages: any[]; createdAt: number; updatedAt: number; cwd: string }>;
  onSelect: (sessionId: string) => void;
  onCancel: () => void;
}) {
  const theme = useThemeStyles();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const searchRef = useRef('');

  const rows: SessionRow[] = sessions
    .filter(s => !searchQuery || (s.id.toLowerCase().includes(searchQuery.toLowerCase()) || (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))))
    .map(s => {
      const ago = getTimeAgo(s.updatedAt);
      const display = s.name || (s.cwd ? s.cwd.split('/').pop() || s.cwd : s.id.slice(-12));
      return {
        id: s.id,
        name: s.name,
        display,
        ago,
        msgCount: s.messages?.length || 0,
        cwd: s.cwd,
        onSelect: () => onSelect(s.id),
      };
    });

  const safeIdx = Math.min(selectedIdx, Math.max(0, rows.length - 1));

  useInput((_input: string, key: any) => {
    if (key.escape) {
      if (mode === 'search') {
        setMode('browse');
        setSearchQuery('');
        searchRef.current = '';
      } else {
        onCancel();
      }
      return;
    }

    if (mode === 'search') {
      if (key.return) {
        if (rows.length > 0) onSelect(rows[safeIdx]?.id || rows[0].id);
        return;
      }
      if (key.backspace) {
        searchRef.current = searchRef.current.slice(0, -1);
        setSearchQuery(searchRef.current);
        setSelectedIdx(0);
        return;
      }
      if (_input && _input.length === 1) {
        searchRef.current += _input;
        setSearchQuery(searchRef.current);
        setSelectedIdx(0);
        return;
      }
      return;
    }

    if (key.return) {
      if (rows.length > 0) onSelect(rows[safeIdx]?.id || rows[0].id);
      return;
    }
    if (key.upArrow) {
      setSelectedIdx(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIdx(prev => Math.min(rows.length - 1, prev + 1));
      return;
    }
    if (_input === '/') {
      setMode('search');
      searchRef.current = '';
      setSearchQuery('');
      return;
    }
  });

  if (sessions.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={theme.warning}>No sessions found.</Text>
        <Text color={theme.textMuted}>Press Esc to go back.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="single" borderColor={theme.border} marginTop={1}>
      <Box marginBottom={1}>
        <Text color={theme.primary} bold>Session Picker</Text>
        <Text color={theme.textMuted}>  (↑↓/Enter/Esc / = search)</Text>
      </Box>
      {mode === 'search' && (
        <Box marginBottom={1}>
          <Text color={theme.warning}>Search: </Text>
          <Text>{searchQuery}</Text>
          <Text color={theme.textMuted}>█</Text>
        </Box>
      )}
      {rows.length === 0 && searchQuery ? (
        <Text color={theme.textMuted}>No sessions matching "{searchQuery}"</Text>
      ) : (
        rows.slice(0, 20).map((row, i) => (
          <SessionPickerRow key={row.id} session={row} isSelected={i === safeIdx} />
        ))
      )}
    </Box>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
