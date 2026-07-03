import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: Error) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryOn: (err: Error) => {
    const msg = err.message?.toLowerCase() || '';
    const code = (err as any).status || (err as any).statusCode || (err as any).code;
    if (code === 429) return true;
    if (code >= 500 && code < 600) return true;
    if (msg.includes('rate limit') || msg.includes('too many requests')) return true;
    if (msg.includes('insufficient balance') || msg.includes('creditserror')) return true;
    if (msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('econnreset')) return true;
    return false;
  },
};

function jitter(delayMs: number): number {
  return delayMs * (0.5 + Math.random() * 0.5);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions,
): Promise<T> {
  const options = { ...defaultOptions, ...opts };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      if (attempt === options.maxRetries || !options.retryOn(e)) {
        throw e;
      }
      const delay = jitter(Math.min(options.baseDelayMs * Math.pow(2, attempt), options.maxDelayMs));
      logger.warn(`Retry ${attempt + 1}/${options.maxRetries} in ${delay.toFixed(0)}ms`, {
        error: e.message,
        attempt: attempt + 1,
        delayMs: delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
