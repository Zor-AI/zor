export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const minLevel: LogLevel = (process.env.ZOR_LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[minLevel];
}

function formatEntry(entry: LogEntry): string {
  const base = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    return base + ' ' + JSON.stringify(entry.context);
  }
  return base;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    context,
  };
  const formatted = formatEntry(entry);
  if (level === 'error' || level === 'fatal') {
    process.stderr.write(formatted + '\n');
  } else {
    process.stdout.write(formatted + '\n');
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
  fatal: (msg: string, ctx?: Record<string, unknown>) => log('fatal', msg, ctx),
};

export default logger;
