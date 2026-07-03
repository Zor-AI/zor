import { describe, it, expect, vi } from 'vitest';

function shellEscape(cmd: string): string {
  return "'" + cmd.replace(/'/g, "'\\''") + "'";
}

function detectEnvironment(): 'local' | 'wsl' | 'lima' | 'docker' | 'unknown' {
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return 'wsl';
  if (process.env.LIMA_INSTANCE) return 'lima';
  if (process.env.DOCKER_CONTAINER) return 'docker';
  return 'local';
}

function isInsideContainer(): boolean {
  return detectEnvironment() === 'docker' || detectEnvironment() === 'lima';
}

describe('shellEscape', () => {
  it('wraps command in single quotes', () => {
    expect(shellEscape('echo hello')).toBe("'echo hello'");
  });

  it('escapes embedded single quotes', () => {
    expect(shellEscape("it's")).toBe("'it'\\''s'");
  });

  it('handles empty string', () => {
    expect(shellEscape('')).toBe("''");
  });

  it('preserves special characters inside quotes', () => {
    expect(shellEscape('echo $HOME && rm -rf /')).toBe("'echo $HOME && rm -rf /'");
  });

  it('handles nested quotes', () => {
    const input = "say 'hi'";
    const expected = "'say '\\''hi'\\'''";
    expect(shellEscape(input)).toBe(expected);
  });
});

describe('detectEnvironment', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns local when no env vars set', () => {
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSL_INTEROP;
    delete process.env.LIMA_INSTANCE;
    delete process.env.DOCKER_CONTAINER;
    expect(detectEnvironment()).toBe('local');
  });

  it('returns wsl when WSL_DISTRO_NAME set', () => {
    process.env.WSL_DISTRO_NAME = 'Ubuntu';
    expect(detectEnvironment()).toBe('wsl');
  });

  it('returns wsl when WSL_INTEROP set', () => {
    process.env.WSL_INTEROP = '/run/WSL/123';
    expect(detectEnvironment()).toBe('wsl');
  });

  it('returns lima when LIMA_INSTANCE set', () => {
    process.env.LIMA_INSTANCE = 'default';
    expect(detectEnvironment()).toBe('lima');
  });

  it('returns docker when DOCKER_CONTAINER set', () => {
    process.env.DOCKER_CONTAINER = '1';
    expect(detectEnvironment()).toBe('docker');
  });
});

describe('isInsideContainer', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns false in local environment', () => {
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSL_INTEROP;
    delete process.env.LIMA_INSTANCE;
    delete process.env.DOCKER_CONTAINER;
    expect(isInsideContainer()).toBe(false);
  });

  it('returns true in docker environment', () => {
    process.env.DOCKER_CONTAINER = '1';
    expect(isInsideContainer()).toBe(true);
  });

  it('returns true in lima environment', () => {
    process.env.LIMA_INSTANCE = 'default';
    expect(isInsideContainer()).toBe(true);
  });

  it('returns false in wsl environment', () => {
    process.env.WSL_DISTRO_NAME = 'Ubuntu';
    expect(isInsideContainer()).toBe(false);
  });
});

import { afterEach } from 'vitest';