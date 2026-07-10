import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAgentInstance = {
  state: { messages: [], tools: [], usage: { input: 0, output: 0 } },
  subscribe: vi.fn(),
  prompt: vi.fn(),
  compact: vi.fn(),
};

vi.mock('@earendil-works/pi-agent-core', () => ({
  Agent: vi.fn().mockImplementation(function () { return mockAgentInstance; }),
}));

vi.mock('@earendil-works/pi-ai', () => ({
  getModel: vi.fn(() => ({
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    api: 'anthropic',
    provider: 'anthropic',
  })),
}));

vi.mock('../permissions/gate', () => ({
  permissionGate: vi.fn(() => undefined),
}));

vi.mock('../session/compact', () => ({
  compactStrategy: vi.fn((msgs: any) => msgs),
}));

vi.mock('../agent/system-prompt', () => ({
  assembleSystemPrompt: vi.fn(() => 'system prompt'),
}));

vi.mock('../agent/tools', () => ({
  buildToolSet: vi.fn(() => []),
}));

const mockMcpConnect = vi.fn().mockResolvedValue({});
const mockMcpGetTools = vi.fn(() => []);

vi.mock('../mcp/client', () => ({
  MCPClient: vi.fn().mockImplementation(function () {
    return { connect: mockMcpConnect, getTools: mockMcpGetTools, disconnectAll: vi.fn() };
  }),
}));

const mockSessionCreate = vi.fn(() => ({
  id: 'session-1',
  messages: [],
  children: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  cwd: '/test',
}));
const mockSessionSave = vi.fn();

vi.mock('../session/manager', () => ({
  SessionManager: vi.fn().mockImplementation(function () {
    return { create: mockSessionCreate, save: mockSessionSave, fork: vi.fn(), getTree: vi.fn(), list: vi.fn(() => []), load: vi.fn(), prune: vi.fn() };
  }),
}));

vi.mock('../llm/resolve', () => ({
  resolveModel: vi.fn().mockResolvedValue({
    provider: { id: 'anthropic', name: 'Anthropic' },
    model: { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    apiKey: 'test-key',
  }),
}));

import { createZorAgent } from '../agent/create';
import { getModel } from '@earendil-works/pi-ai';
import { resolveModel } from '../llm/resolve';

const defaultConfig = {
  model: 'anthropic/claude-sonnet-4-20250514',
  effort: 'high',
  permissions: 'confirm',
  session: { dir: './.zor/sessions', compactThreshold: 160000 },
  mcp: { servers: [] },
};

describe('createZorAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAgentInstance.state = { messages: [], tools: [], usage: { input: 0, output: 0 } };
  });

  it('returns agent, model, sessionManager', async () => {
    const result = await createZorAgent(defaultConfig);
    expect(result.agent).toBeDefined();
    expect(result.model).toBeDefined();
    expect(result.sessionManager).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.mcpErrors).toEqual([]);
  });

  it('creates model for known providers', async () => {
    await createZorAgent(defaultConfig);
    expect(getModel).toHaveBeenCalledWith('anthropic', 'claude-sonnet-4-20250514');
  });

  it('creates model for unknown providers (ollama)', async () => {
    vi.mocked(resolveModel).mockResolvedValueOnce({
      provider: { id: 'ollama', name: 'Ollama (Local)', api: 'ollama', baseUrl: '', envKey: '', models: [] } as any,
      model: { id: 'llama3', name: 'llama3', contextWindow: 32768, maxTokens: 4096, supportsThinking: false, supportsVision: false, pricing: { input: 0, output: 0 } },
      apiKey: 'ollama',
    });
    const result = await createZorAgent(defaultConfig);
    expect(result.model).toBeDefined();
    expect(result.model.provider).toBe('ollama');
  });

  it('collects MCP errors', async () => {
    mockMcpConnect.mockRejectedValueOnce(new Error('MCP server failed'));
    const configWithMcp = { ...defaultConfig, mcp: { servers: ['{"name":"bad","transport":"stdio","command":"npx"}'] } };
    const result = await createZorAgent(configWithMcp);
    expect(result.mcpErrors.length).toBeGreaterThan(0);
    expect(result.mcpErrors[0]).toContain('MCP server failed');
  });

  it('persists session on turn_end', async () => {
    await createZorAgent(defaultConfig);
    const subscribeCall = mockAgentInstance.subscribe.mock.calls[0];
    const eventHandler = subscribeCall[0];
    eventHandler({ type: 'turn_end', message: {} });
    expect(mockSessionSave).toHaveBeenCalled();
  });
});