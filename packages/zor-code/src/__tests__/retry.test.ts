import { describe, it, expect, vi } from 'vitest';
vi.mock('../utils/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { withRetry } from '../utils/retry';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    expect(await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('rate limit'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('ok');
    expect(await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('timeout'));
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow('timeout');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable errors', async () => {
    const err = new Error('bad request');
    (err as any).status = 400;
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on HTTP 429', async () => {
    const err = new Error('too many');
    (err as any).status = 429;
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue('ok');
    expect(await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on HTTP 503', async () => {
    const err = new Error('unavailable');
    (err as any).status = 503;
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue('ok');
    expect(await withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).toBe('ok');
  });
});
