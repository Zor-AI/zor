import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => {
  const store = new Map<string, string>();
  return {
    existsSync: (p: string) => store.has(p),
    mkdirSync: () => {},
    readFileSync: (p: string) => store.get(p) ?? '',
    writeFileSync: (p: string, data: string) => { store.set(p, data); },
    chmodSync: () => {},
    readdirSync: () => [],
  };
});

import { setKey, getKey, removeKey, listKeys, getKeyStatuses } from '../llm/keys';

beforeEach(async () => {
  vi.resetModules();
});

describe('keys', () => {
  it('setKey stores key and getKey retrieves it', async () => {
    const { setKey, getKey } = await import('../llm/keys');
    setKey('anthropic', 'sk-ant-test123');
    expect(getKey('anthropic')).toBe('sk-ant-test123');
  });

  it('removeKey deletes key', async () => {
    const { setKey, getKey, removeKey } = await import('../llm/keys');
    setKey('openai', 'sk-openai-test');
    expect(getKey('openai')).toBe('sk-openai-test');
    removeKey('openai');
    expect(getKey('openai')).toBeNull();
  });

  it('getKeyStatuses returns list with hasKey boolean', async () => {
    const statuses = getKeyStatuses();
    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeGreaterThan(0);
    for (const s of statuses) {
      expect(s).toHaveProperty('provider');
      expect(s).toHaveProperty('name');
      expect(typeof s.hasKey).toBe('boolean');
    }
  });

  it('listKeys returns provider names with masked keys', async () => {
    const { setKey, listKeys } = await import('../llm/keys');
    setKey('test-provider', 'abcdefghijklmnop');
    const keys = listKeys();
    const entry = keys.find((k: any) => k.provider === 'test-provider');
    expect(entry).toBeDefined();
    expect(entry!.masked).toMatch(/^abcdef\.\.\.mnop$/);
    expect(entry!.setAt).toBeDefined();
  });

  it('getKey returns null for missing provider', async () => {
    const { getKey } = await import('../llm/keys');
    expect(getKey('nonexistent-provider')).toBeNull();
  });
});