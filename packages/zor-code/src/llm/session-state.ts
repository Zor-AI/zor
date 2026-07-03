import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.zor');
const LAST_SESSION_FILE = join(CONFIG_DIR, 'last-session.json');

export interface LastSession {
  provider: string;
  model: string;
  updatedAt: string;
}

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function ensurePermissions() {
  try {
    if (existsSync(CONFIG_DIR)) chmodSync(CONFIG_DIR, 0o700);
    if (existsSync(LAST_SESSION_FILE)) chmodSync(LAST_SESSION_FILE, 0o600);
  } catch {}
}

export function loadLastSession(): LastSession | null {
  ensureDir();
  ensurePermissions();
  if (!existsSync(LAST_SESSION_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(LAST_SESSION_FILE, 'utf8'));
    if (!data.provider || !data.model || typeof data.provider !== 'string' || typeof data.model !== 'string') {
      return null;
    }
    return data as LastSession;
  } catch {
    return null;
  }
}

export function saveLastSession(provider: string, model: string) {
  ensureDir();
  const data: LastSession = {
    provider,
    model,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(LAST_SESSION_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  ensurePermissions();
}
