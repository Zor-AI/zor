import { describe, it, expect, vi } from 'vitest';
import { compactStrategy } from '../session/compact';
import type { AgentMessage } from '@earendil-works/pi-agent-core';

function makeMessages(count: number, textLen: number = 100): AgentMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: 'x'.repeat(textLen),
    timestamp: Date.now() + i,
  } as AgentMessage));
}

describe('compactStrategy', () => {
  it('returns messages unchanged when below threshold', async () => {
    const messages = makeMessages(5, 10);
    const result = await compactStrategy(messages, 100000);
    expect(result).toEqual(messages);
  });

  it('summarizes old messages when above threshold', async () => {
    const messages = makeMessages(30, 500);
    const result = await compactStrategy(messages, 100);
    expect(result.length).toBeLessThan(messages.length);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('Context compacted');
  });

  it('keeps last 20 messages', async () => {
    const messages = makeMessages(30, 500);
    const result = await compactStrategy(messages, 100);
    expect(result.length).toBeLessThanOrEqual(21);
  });

  it('uses custom summarize callback', async () => {
    const messages = makeMessages(30, 500);
    const summarize = vi.fn().mockResolvedValue('Custom summary of context');
    const result = await compactStrategy(messages, 100, summarize);
    expect(summarize).toHaveBeenCalledOnce();
    expect(result[0].content).toBe('Custom summary of context');
  });

  it('returns all messages if fewer than KEEP_RAW', async () => {
    const messages = makeMessages(15, 500);
    const result = await compactStrategy(messages, 1);
    expect(result).toEqual(messages);
  });

  it('summary message has role user', async () => {
    const messages = makeMessages(30, 500);
    const result = await compactStrategy(messages, 100);
    expect(result[0].role).toBe('user');
  });
});
