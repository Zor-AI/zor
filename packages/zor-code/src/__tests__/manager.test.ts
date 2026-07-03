import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs', () => {
  const store = new Map<string, string>();
  return {
    existsSync: (p: string) => store.has(p),
    mkdirSync: (p: string) => { store.set(p, ''); },
    readdirSync: (p: string) => {
      const prefix = p.replace(/\\/g, '/').replace(/\/$/, '');
      const files: string[] = [];
      for (const key of store.keys()) {
        const normalized = key.replace(/\\/g, '/');
        if (normalized.startsWith(prefix + '/') && normalized.endsWith('.jsonl')) {
          files.push(path.basename(key));
        }
      }
      return files;
    },
    readFileSync: (p: string) => store.get(p) ?? '',
    writeFileSync: (p: string, data: string) => { store.set(p, data); },
    renameSync: (from: string, to: string) => {
      const data = store.get(from);
      if (data !== undefined) store.set(to, data);
      store.delete(from);
    },
    unlinkSync: (p: string) => { store.delete(p); },
  };
});

import { SessionManager } from '../session/manager';

describe('SessionManager', () => {
  let manager: SessionManager;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = `/tmp/zor-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    manager = new SessionManager(tmpDir);
  });

  it('create() returns session with id and createdAt', () => {
    const session = manager.create('/tmp');
    expect(session.id).toMatch(/^session-/);
    expect(typeof session.createdAt).toBe('number');
    expect(session.messages).toEqual([]);
    expect(session.children).toEqual([]);
    expect(session.cwd).toBe('/tmp');
  });

  it('save() writes JSONL file and load() retrieves it', () => {
    const session = manager.create('/test');
    const loaded = manager.load(session.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(session.id);
  });

  it('list() returns all sessions', () => {
    manager.create('/a');
    manager.create('/b');
    manager.create('/c');
    const list = manager.list();
    expect(list.length).toBe(3);
  });

  it('list() sorts by updatedAt descending', () => {
    const s1 = manager.create('/a');
    const s2 = manager.create('/b');
    const s3 = manager.create('/c');
    const list = manager.list();
    expect(list.length).toBe(3);
    expect(list[0].updatedAt).toBeGreaterThanOrEqual(list[1].updatedAt);
    expect(list[1].updatedAt).toBeGreaterThanOrEqual(list[2].updatedAt);
  });

  it('get() retrieves by ID', () => {
    const session = manager.create('/test');
    const loaded = manager.load(session.id);
    expect(loaded!.id).toBe(session.id);
    expect(loaded!.cwd).toBe('/test');
  });

  it('get() returns null for missing ID', () => {
    const loaded = manager.load('nonexistent');
    expect(loaded).toBeNull();
  });

  it('prune() removes old sessions', () => {
    for (let i = 0; i < 5; i++) {
      manager.create('/test');
    }
    manager.prune(3);
    expect(manager.list().length).toBe(3);
  });

  it('fork() creates child session with parent reference', () => {
    const parent = manager.create('/parent');
    parent.messages = [{ role: 'user', content: 'hello' }] as any;
    manager.save(parent);
    const forked = manager.fork(parent);
    expect(forked.parentId).toBe(parent.id);
    expect(forked.messages).toEqual(parent.messages);
    const updatedParent = manager.load(parent.id);
    expect(updatedParent!.children).toContain(forked.id);
  });
});