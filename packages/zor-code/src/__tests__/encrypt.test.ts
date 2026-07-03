import { describe, it, expect, vi } from 'vitest';
vi.mock('../utils/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { encrypt, decrypt, tryDecrypt } from '../utils/encrypt';

describe('encrypt', () => {
  it('encrypts and decrypts roundtrip', () => {
    const plain = 'hello world';
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it('empty string roundtrips', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  it('long string roundtrips', () => {
    const plain = 'a'.repeat(10000);
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('unicode roundtrips', () => {
    expect(decrypt(encrypt('Hello 世界 🔐'))).toBe('Hello 世界 🔐');
  });

  it('different IVs produce different ciphertext', () => {
    expect(encrypt('test')).not.toBe(encrypt('test'));
  });

  it('decrypt invalid base64 returns null', () => {
    expect(decrypt('!!!not-valid-base64!!!')).toBeNull();
  });

  it('decrypt truncated ciphertext returns null', () => {
    expect(decrypt(encrypt('test').slice(0, 10))).toBeNull();
  });

  it('tryDecrypt passes through plain JSON', () => {
    expect(tryDecrypt('{"key":"value"}')).toBe('{"key":"value"}');
  });

  it('tryDecrypt passes through plain array', () => {
    expect(tryDecrypt('[1,2,3]')).toBe('[1,2,3]');
  });

  it('tryDecrypt decrypts encrypted content', () => {
    expect(tryDecrypt(encrypt('secret-data'))).toBe('secret-data');
  });
});
