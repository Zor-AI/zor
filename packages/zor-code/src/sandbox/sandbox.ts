import { execSync, spawn, spawnSync, SpawnOptions } from 'child_process';

export interface SandboxConfig {
  enabled: boolean;
  type: 'wsl2' | 'lima' | 'docker' | 'none';
  timeout: number;
  maxOutput: number;
}

const defaultSandbox: SandboxConfig = {
  enabled: false,
  type: 'none',
  timeout: 30000,
  maxOutput: 50000,
};

function shellEscape(cmd: string): string {
  return "'" + cmd.replace(/'/g, "'\\''") + "'";
}

function detectSandbox(): SandboxConfig {
  if (process.platform === 'win32') {
    try {
      execSync('wsl --list --quiet', { stdio: 'pipe' });
      return { ...defaultSandbox, enabled: true, type: 'wsl2' };
    } catch {}
  }
  if (process.platform === 'darwin') {
    try {
      execSync('limactl list', { stdio: 'pipe' });
      return { ...defaultSandbox, enabled: true, type: 'lima' };
    } catch {}
  }
  try {
    execSync('docker info', { stdio: 'pipe' });
    return { ...defaultSandbox, enabled: true, type: 'docker' };
  } catch {}
  return defaultSandbox;
}

export class Sandbox {
  private config: SandboxConfig;

  constructor(config?: Partial<SandboxConfig>) {
    this.config = config?.enabled ? { ...defaultSandbox, ...config } : detectSandbox();
  }

  async exec(command: string, timeout?: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const t = timeout || this.config.timeout;

    if (!this.config.enabled || this.config.type === 'none') {
      return this.execDirect(command, t);
    }

    switch (this.config.type) {
      case 'wsl2':
        return this.execWSL2(command, t);
      case 'lima':
        return this.execLima(command, t);
      case 'docker':
        return this.execDocker(command, t);
      default:
        return this.execDirect(command, t);
    }
  }

  private shellCommand(): [string, string[]] {
    if (process.platform === 'win32') {
      return ['cmd', ['/d', '/s', '/c']];
    }
    return ['sh', ['-c']];
  }

  private execDirect(command: string, timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const [bin, args] = this.shellCommand();
      const proc = spawn(bin, [...args, command], { timeout });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (data: Buffer) => { if (stdout.length < this.config.maxOutput) stdout += data.toString(); });
      proc.stderr.on('data', (data: Buffer) => { if (stderr.length < this.config.maxOutput) stderr += data.toString(); });
      proc.on('close', (code) => { resolve({ stdout, stderr, exitCode: code ?? 1 }); });
      proc.on('error', () => { resolve({ stdout, stderr: 'Failed to start process', exitCode: 1 }); });
    });
  }

  private execWSL2(command: string, timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return this.execDirect(`wsl bash -c ${shellEscape(command)}`, timeout);
  }

  private execLima(command: string, timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return this.execDirect(`limactl shell default bash -c ${shellEscape(command)}`, timeout);
  }

  private execDocker(command: string, timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return this.execDirect(`docker run --rm alpine sh -c ${shellEscape(command)}`, timeout);
  }

  getInfo(): SandboxConfig {
    return this.config;
  }
}