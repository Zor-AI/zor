import { ZorConfig } from '../config';

let sandboxConfig: ZorConfig['sandbox'] = { enabled: false, allowPaths: [], denyPaths: [], allowHosts: [], denyHosts: [] };

export function setSandboxConfig(config: ZorConfig['sandbox']) {
  sandboxConfig = config || { enabled: false, allowPaths: [], denyPaths: [], allowHosts: [], denyHosts: [] };
}

export function getSandboxConfig() {
  return sandboxConfig;
}

export function checkPathAccess(filepath: string): { allowed: boolean; reason?: string } {
  const config = getSandboxConfig();
  if (!config?.enabled) return { allowed: true };

  const resolved = filepath;
  
  // Check deny paths first (more restrictive)
  for (const deny of config.denyPaths || []) {
    if (resolved.startsWith(deny)) {
      return { allowed: false, reason: `Path blocked by denyPaths: ${deny}` };
    }
  }
  
  // If allowPaths specified, path must match at least one
  if (config.allowPaths && config.allowPaths.length > 0) {
    let allowed = false;
    for (const allow of config.allowPaths) {
      if (resolved.startsWith(allow)) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      return { allowed: false, reason: `Path not in allowPaths` };
    }
  }
  
  return { allowed: true };
}

export function checkHostAccess(host: string): { allowed: boolean; reason?: string } {
  const config = getSandboxConfig();
  if (!config?.enabled) return { allowed: true };

  const hostname = host.startsWith('http') ? new URL(host).hostname : host;
  
  for (const deny of config.denyHosts || []) {
    if (hostname === deny || hostname.endsWith('.' + deny)) {
      return { allowed: false, reason: `Host blocked by denyHosts: ${deny}` };
    }
  }
  
  if (config.allowHosts && config.allowHosts.length > 0) {
    let allowed = false;
    for (const allow of config.allowHosts) {
      if (hostname === allow || hostname.endsWith('.' + allow)) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      return { allowed: false, reason: `Host not in allowHosts` };
    }
  }
  
  return { allowed: true };
}