import { join } from 'path';
import { mkdir, open, readdir, unlink, type FileHandle } from 'fs/promises';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
}

interface Sink {
  write(entry: string): void;
  close?(): Promise<void> | void;
}

class StdoutSink implements Sink {
  write(entry: string) { process.stdout.write(entry + '\n'); }
}

class StderrSink implements Sink {
  write(entry: string) { process.stderr.write(entry + '\n'); }
}

class FileSink implements Sink {
  private fd: FileHandle | null = null;
  private currentFile = '';
  private currentSize = 0;
  private maxSize: number;
  private maxFiles: number;
  private dir: string;

  constructor(dir: string, maxSizeMB: number, maxFiles: number) {
    this.dir = dir;
    this.maxSize = maxSizeMB * 1024 * 1024;
    this.maxFiles = maxFiles;
  }

  private async ensureDir() {
    await mkdir(this.dir, { recursive: true });
  }

  private getNextFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `${dateStr}-${timeStr}.log`;
  }

  private async rotate() {
    if (this.fd !== null) {
      await this.fd.close();
      this.fd = null;
    }
    this.currentFile = this.getNextFileName();
    this.currentSize = 0;
    await this.ensureDir();
    this.fd = await open(join(this.dir, this.currentFile), 'a');
  }

  private async prune() {
    const files = (await readdir(this.dir))
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse();
    if (files.length > this.maxFiles) {
      for (const f of files.slice(this.maxFiles)) {
        await unlink(join(this.dir, f)).catch(() => {});
      }
    }
  }

  async write(entry: string) {
    if (this.fd === null || this.currentSize + entry.length > this.maxSize) {
      await this.rotate();
    }
    if (this.fd !== null) {
      await this.fd.write(entry + '\n');
      this.currentSize += entry.length + 1;
      if (this.currentSize > this.maxSize) {
        await this.prune();
      }
    }
  }

  async close() {
    if (this.fd !== null) {
      await this.fd.close();
      this.fd = null;
    }
  }
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

let minLevel: LogLevel = 'info';
let sinks: Sink[] = [new StdoutSink()];

export function configureLogger(config: {
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  sinks?: ('stdout' | 'stderr' | 'file')[];
  file?: { dir: string; maxSizeMB: number; maxFiles: number };
}) {
  if (config.level) minLevel = config.level;
  sinks = [];
  if (config.sinks?.includes('stdout') ?? true) sinks.push(new StdoutSink());
  if (config.sinks?.includes('stderr')) sinks.push(new StderrSink());
  if (config.sinks?.includes('file')) {
    const fileCfg = config.file || { dir: '~/.zor/logs', maxSizeMB: 10, maxFiles: 5 };
    sinks.push(new FileSink(fileCfg.dir, fileCfg.maxSizeMB, fileCfg.maxFiles));
  }
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[minLevel];
}

function formatEntry(entry: { level: LogLevel; timestamp: string; message: string; context?: Record<string, unknown> }): string {
  const base = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    return base + ' ' + JSON.stringify(entry.context);
  }
  return base;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry = { level, timestamp: new Date().toISOString(), message, context };
  const formatted = formatEntry(entry);
  for (const sink of sinks) sink.write(formatted);
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
  fatal: (msg: string, ctx?: Record<string, unknown>) => log('fatal', msg, ctx),
};

export async function shutdownLogger() {
  for (const sink of sinks) {
    if (sink.close) await sink.close();
  }
}