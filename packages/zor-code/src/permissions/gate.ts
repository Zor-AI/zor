type PermissionMode = 'auto' | 'confirm' | 'deny';

const DESTRUCTIVE_TOOLS = new Set(['bash', 'write', 'edit']);
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /mkfs/,
  /dd\s+if=/,
  /:(){ :\|:& };:/,
  /chmod\s+777/,
  /curl.*\|.*sh/,
  /sudo/,
];
const PROTECTED_PATTERNS = ['.env', 'credentials', 'secrets', '*.pem', 'id_rsa', /.ssh\//, /\.git\/config/];

export function permissionGate(
  mode: PermissionMode,
  toolCall: { name: string },
  args: Record<string, unknown>
): { block?: boolean; reason?: string } | undefined {
  const isDestructive = DESTRUCTIVE_TOOLS.has(toolCall.name);

  if (isDestructive && toolCall.name === 'bash') {
    const cmd = (args as { command: string }).command || '';
    if (DANGEROUS_PATTERNS.some(p => p.test(cmd))) {
      return { block: true, reason: `Dangerous command blocked: ${cmd}` };
    }
  }

  if (isDestructive && toolCall.name === 'write') {
    const filepath = (args as { path: string }).path || '';
    if (PROTECTED_PATTERNS.some(p => filepath.match(p))) {
      return { block: true, reason: `Protected path: ${filepath}` };
    }
  }

  if (mode === 'deny') {
    if (isDestructive) {
      return { block: true, reason: `${toolCall.name} blocked (deny mode)` };
    }
    return undefined;
  }

  if (mode === 'confirm' && isDestructive) {
    return { block: true, reason: `Confirm: run ${toolCall.name}? Restart in auto mode to skip confirmations.` };
  }

  return undefined;
}