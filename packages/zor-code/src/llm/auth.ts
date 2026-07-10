import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.zor');
const TOKENS_FILE = join(CONFIG_DIR, 'tokens.json');

interface TokenEntry {
  provider: string;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
  updatedAt: string;
}

export function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadTokens(): TokenEntry[] {
  if (!existsSync(TOKENS_FILE)) return [];
  try {
    const content = readFileSync(TOKENS_FILE, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveTokens(tokens: TokenEntry[]) {
  ensureDir();
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  chmodSync(TOKENS_FILE, 0o600);
}

export function getToken(providerId: string): string | null {
  const tokens = loadTokens();
  const entry = tokens.find(t => t.provider === providerId);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() >= entry.expiresAt) return null;
  return entry.token;
}

export function setToken(providerId: string, token: string, refreshToken?: string, expiresIn?: number) {
  const tokens = loadTokens();
  const idx = tokens.findIndex(t => t.provider === providerId);
  const entry: any = {
    provider: providerId,
    token,
    updatedAt: new Date().toISOString(),
  };
  if (refreshToken) entry.refreshToken = refreshToken;
  if (expiresIn) entry.expiresAt = Date.now() + expiresIn * 1000;
  if (idx >= 0) tokens[idx] = entry;
  else tokens.push(entry);
  saveTokens(tokens);
}

export function removeToken(providerId: string) {
  const tokens = loadTokens().filter(t => t.provider !== providerId);
  saveTokens(tokens);
}

export function resolveAuthToken(provider: { id: string; api: string; envKey: string }): string | null {
  if (provider.api === 'ollama') return 'ollama';

  const cached = getToken(provider.id);
  if (cached) return cached;

  const envKey = process.env[provider.envKey];
  if (envKey) return envKey;

  return null;
}

export function getAuthToken(providerId: string, getAllProviders: () => Array<{ id: string; envKey: string; api: string }>): string | null {
  const providers = getAllProviders();
  const provider = providers.find(p => p.id === providerId);
  if (!provider) return null;
  return resolveAuthToken(provider);
}

export function hasValidToken(providerId: string): boolean {
  return !!getToken(providerId);
}