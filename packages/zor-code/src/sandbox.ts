import { homedir } from 'os';
import { resolve, relative, isAbsolute, sep } from 'path';

export interface SandboxConfig {
  enabled: boolean;
  allowPaths?: string[];
  denyPaths?: string[];
  allowHosts?: string[];
  denyHosts?: string[];
}

export function getSandboxConfig(config: any): SandboxConfig {
  if (!config.sandbox) {
    return { enabled: false };
  }
  if (typeof config.sandbox === 'boolean') {
    return { enabled: true };
  }
  return {
    enabled: true,
    allowPaths: config.sandbox.allowPaths,
    denyPaths: config.sandbox.denyPaths,
    allowHosts: config.sandbox.allowHosts,
    denyHosts: config.sandbox.denyHosts,
  };
}

function normalizePath(p: string): string {
  return resolve(p).replace(/\\/g, '/');
}

function pathMatches(patterns: string[] | undefined, target: string): boolean {
  if (!patterns || patterns.length === 0) return false;
  const normalizedTarget = normalizePath(target);
  for (const p of patterns) {
    const normalized = normalizePath(p);
    if (normalizedTarget === normalized || normalizedTarget.startsWith(normalized + '/')) {
      return true;
    }
  }
  return false;
}

export function checkPathAccess(config: any, targetPath: string): { allowed: boolean; reason?: string } {
  const sandbox = getSandboxConfig({ sandbox: true }); // default deny when enabled
  if (!sandbox.enabled) return { allowed: true };

  const normalizedTarget = normalizePath(targetPath);

  // Check deny paths first (deny takes precedence)
  if (sandbox.denyPaths && pathMatches(sandbox.denyPaths, targetPath)) {
    return { allowed: false, reason: `Path denied by sandbox: ${targetPath}` };
  }

  // If allowPaths specified, must match one
  if (sandbox.allowPaths && sandbox.allowPaths.length > 0) {
    if (!pathMatches(sandbox.allowPaths, targetPath)) {
      return { allowed: false, reason: `Path not in allowed paths: ${targetPath}` };
    }
  }

  return { allowed: true };
}

export function checkHostAccess(config: any, host: string): { allowed: boolean; reason?: string } {
  const sandbox = getSandboxConfig({ sandbox: true });
  if (!sandbox.enabled) return { allowed: true };

  if (sandbox.denyHosts && sandbox.denyHosts.includes(host)) {
    return { allowed: false, reason: `Host denied by sandbox: ${host}` };
  }

  if (sandbox.allowHosts && sandbox.allowHosts.length > 0) {
    if (!sandbox.allowHosts.includes(host)) {
      return { allowed: false, reason: `Host not in allowed list: ${host}` };
    }
  }

  return { allowed: true };
}