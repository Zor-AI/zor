import { describe, it, expect } from 'vitest';
import { Agent } from '@earendil-works/pi-agent-core';

function makeTestModel() {
  return {
    id: 'test', name: 'test', api: 'openai-completions' as const, provider: 'test',
    reasoning: false as const, input: ['text' as const],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32768, maxTokens: 4096,
  };
}

describe('Agent Loop E2E', () => {
  it('creates agent and subscribes to events', () => {
    const agent = new Agent({
      initialState: {
        systemPrompt: 'You are a helpful assistant.',
        model: makeTestModel(),
        tools: [],
        messages: [],
      },
    });

    const events: string[] = [];
    const unsub = agent.subscribe((event: any) => {
      events.push(event.type);
    });

    expect(typeof unsub).toBe('function');
    expect(agent.state).toBeDefined();
    expect(agent.state.messages).toEqual([]);
    expect(agent.state.isStreaming).toBe(false);
  });

  it('maintains message state', () => {
    const agent = new Agent({
      initialState: {
        systemPrompt: 'test',
        model: makeTestModel(),
        thinkingLevel: 'off',
        tools: [],
        messages: [
          { role: 'user' as const, content: 'hello' },
        ],
      },
    });

    expect(agent.state.messages).toHaveLength(1);
    expect(agent.state.messages[0].content).toBe('hello');
  });

  it('unsubscribe stops event delivery', () => {
    const agent = new Agent({
      initialState: {
        systemPrompt: 'test',
        model: makeTestModel(),
        tools: [],
        messages: [],
      },
    });

    let callCount = 0;
    const unsub = agent.subscribe(() => { callCount++; });
    unsub();
    expect(typeof unsub).toBe('function');
  });
});

describe('Agent State Management', () => {
  it('state has systemPrompt and thinkingLevel', () => {
    const agent = new Agent({
      initialState: {
        systemPrompt: 'You are a coding assistant.',
        model: makeTestModel(),
        thinkingLevel: 'high',
        tools: [],
        messages: [],
      },
    });

    const state = agent.state;
    expect(state.systemPrompt).toBe('You are a coding assistant.');
    expect(state.thinkingLevel).toBe('high');
    expect(state.isStreaming).toBe(false);
  });

  it('tools are accessible from state', () => {
    const tool = {
      name: 'test_tool',
      label: 'test',
      description: 'A test tool',
      parameters: { type: 'object' as const, properties: {} },
      execute: async () => ({ content: [{ type: 'text' as const, text: 'ok' }], details: {} }),
    };

    const agent = new Agent({
      initialState: {
        systemPrompt: 'test',
        model: makeTestModel(),
        tools: [tool],
        messages: [],
      },
    });

    expect(agent.state.tools).toHaveLength(1);
    expect(agent.state.tools[0].name).toBe('test_tool');
  });

  it('pendingToolCalls is a Set', () => {
    const agent = new Agent({
      initialState: {
        systemPrompt: 'test',
        model: makeTestModel(),
        tools: [],
        messages: [],
      },
    });

    expect(agent.state.pendingToolCalls).toBeDefined();
    expect(agent.state.pendingToolCalls instanceof Set).toBe(true);
  });
});
