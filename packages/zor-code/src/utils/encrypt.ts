import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { hostname } from 'os';

function deriveKey(): Buffer {
  if (process.env.ZOR_DISABLE_ENCRYPTION === 'true') return Buffer.alloc(32);

  const envKey = process.env.ZOR_ENCRYPT_KEY;
  if (envKey) return Buffer.from(envKey.padEnd(32).slice(0, 32), 'utf8');

  const hostKey = hostname().padEnd(32).slice(0, 32);
  return Buffer.from(hostKey, 'utf8');
}

const ALGORITHM = 'aes-256-gcm';
const KEY = deriveKey();

export function encrypt(plaintext: string): string {
  if (process.env.ZOR_DISABLE_ENCRYPTION === 'true') return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64');
}

export function decrypt(ciphertext: string): string | null {
  if (process.env.ZOR_DISABLE_ENCRYPTION === 'true') return ciphertext;

  try {
    const combined = Buffer.from(ciphertext, 'base64');
    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function tryDecrypt(data: string): string {
  if (process.env.ZOR_DISABLE_ENCRYPTION === 'true') return data;
  if (data.startsWith('{') || data.startsWith('[')) return data;
  return decrypt(data) || data;
}
