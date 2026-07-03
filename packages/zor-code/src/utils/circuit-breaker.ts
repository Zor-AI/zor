import { logger } from './logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxRequests?: number;
}

interface BreakerEntry {
  failures: number;
  lastFailure: number;
  state: CircuitState;
  halfOpenCount: number;
}

export class CircuitBreaker {
  private providers = new Map<string, BreakerEntry>();
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private halfOpenMaxRequests: number;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 15000;
    this.halfOpenMaxRequests = opts.halfOpenMaxRequests ?? 1;
  }

  private getEntry(name: string): BreakerEntry {
    let entry = this.providers.get(name);
    if (!entry) {
      entry = { failures: 0, lastFailure: 0, state: 'closed', halfOpenCount: 0 };
      this.providers.set(name, entry);
    }
    return entry;
  }

  canExecute(name: string): boolean {
    const entry = this.getEntry(name);

    if (entry.state === 'open') {
      if (Date.now() - entry.lastFailure >= this.resetTimeoutMs) {
        entry.state = 'half-open';
        entry.halfOpenCount = 0;
        logger.info(`Circuit half-open for ${name}`, { provider: name });
        return true;
      }
      return false;
    }

    if (entry.state === 'half-open') {
      if (entry.halfOpenCount >= this.halfOpenMaxRequests) {
        return false;
      }
      entry.halfOpenCount++;
      return true;
    }

    return true;
  }

  success(name: string) {
    const entry = this.getEntry(name);
    if (entry.state === 'half-open') {
      entry.state = 'closed';
      entry.failures = 0;
      logger.info(`Circuit closed for ${name}`, { provider: name });
    } else {
      entry.failures = 0;
    }
  }

  failure(name: string) {
    const entry = this.getEntry(name);
    entry.failures++;
    entry.lastFailure = Date.now();

    if (entry.state === 'half-open') {
      entry.state = 'open';
      logger.warn(`Circuit re-opened for ${name}`, { provider: name, failures: entry.failures });
      return;
    }

    if (entry.failures >= this.failureThreshold) {
      entry.state = 'open';
      logger.warn(`Circuit opened for ${name}`, { provider: name, failures: entry.failures });
    }
  }

  isOpen(name: string): boolean {
    return this.getEntry(name).state === 'open';
  }

  reset(name: string) {
    this.providers.delete(name);
  }

  resetAll() {
    this.providers.clear();
  }
}
