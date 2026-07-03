import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../utils/rate-limiter';

beforeEach(() => {
  vi.useFakeTimers();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RateLimiter', () => {
  it('allows requests when tokens available', async () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.remaining).toBe(0);
  });

  it('blocks when empty then refills over time', async () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.remaining).toBe(0);

    const acquirePromise = limiter.acquire();
    vi.advanceTimersByTime(1010);
    await acquirePromise;
    expect(limiter.remaining).toBe(1);
  });

  it('respects configurable window and max requests', async () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 500 });
    await limiter.acquire();
    expect(limiter.remaining).toBe(0);

    vi.advanceTimersByTime(400);
    expect(limiter.remaining).toBe(0);

    vi.advanceTimersByTime(200);
    expect(limiter.remaining).toBe(1);
  });

  it('remaining returns correct count after multiple acquires', async () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
    expect(limiter.remaining).toBe(5);
    await limiter.acquire();
    expect(limiter.remaining).toBe(4);
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.remaining).toBe(2);
  });

  it('refills tokens as window expires', async () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    await limiter.acquire();
    vi.advanceTimersByTime(500);
    await limiter.acquire();
    expect(limiter.remaining).toBe(0);

    vi.advanceTimersByTime(1010);
    expect(limiter.remaining).toBe(2);
  });
});

import { afterEach } from 'vitest';