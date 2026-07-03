import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../utils/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { CircuitBreaker } from '../utils/circuit-breaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;
  beforeEach(() => { cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100, halfOpenMaxRequests: 1 }); });

  it('allows first request', () => expect(cb.canExecute('test')).toBe(true));

  it('allows up to threshold failures', () => {
    cb.failure('test'); cb.failure('test');
    expect(cb.canExecute('test')).toBe(true);
  });

  it('opens after threshold failures', () => {
    cb.failure('test'); cb.failure('test'); cb.failure('test');
    expect(cb.canExecute('test')).toBe(false);
  });

  it('isOpen true when circuit open', () => {
    cb.failure('test'); cb.failure('test'); cb.failure('test');
    expect(cb.isOpen('test')).toBe(true);
  });

  it('half-opens after reset timeout', async () => {
    cb.failure('test'); cb.failure('test'); cb.failure('test');
    expect(cb.canExecute('test')).toBe(false);
    await new Promise(r => setTimeout(r, 150));
    expect(cb.canExecute('test')).toBe(true);
  });

  it('success closes half-open circuit', async () => {
    cb.failure('test'); cb.failure('test'); cb.failure('test');
    await new Promise(r => setTimeout(r, 150));
    expect(cb.canExecute('test')).toBe(true);
    cb.success('test');
    expect(cb.isOpen('test')).toBe(false);
  });

  it('failure reopens half-open circuit', async () => {
    cb.failure('test'); cb.failure('test'); cb.failure('test');
    await new Promise(r => setTimeout(r, 150));
    cb.failure('test');
    expect(cb.isOpen('test')).toBe(true);
  });

  it('resetAll clears all circuits', () => {
    cb.failure('a'); cb.failure('a'); cb.failure('a');
    cb.failure('b'); cb.failure('b'); cb.failure('b');
    cb.resetAll();
    expect(cb.isOpen('a')).toBe(false);
    expect(cb.isOpen('b')).toBe(false);
  });

  it('reset clears single provider', () => {
    cb.failure('x'); cb.failure('x'); cb.failure('x');
    cb.reset('x');
    expect(cb.isOpen('x')).toBe(false);
  });

  it('unknown provider defaults to closed', () => {
    expect(cb.isOpen('unknown')).toBe(false);
    expect(cb.canExecute('unknown')).toBe(true);
  });
});
