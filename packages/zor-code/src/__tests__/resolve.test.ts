import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../llm/providers', () => ({
  getAllProviders: vi.fn(() => [
    {
      id: 'anthropic',
      name: 'Anthropic',
      api: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      envKey: 'ANTHROPIC_API_KEY',
      models: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxTokens: 8192, supportsThinking: true, supportsVision: true, pricing: { input: 3, output: 15 } },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      api: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      envKey: 'OPENAI_API_KEY',
      models: [
        { id: 'gpt-5', name: 'GPT-5', contextWindow: 128000, maxTokens: 16384, supportsThinking: false, supportsVision: true, pricing: { input: 10, output: 30 } },
      ],
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      api: 'ollama',
      baseUrl: 'http://localhost:11434',
      envKey: '',
      models: [],
    },
  ]),
}));

vi.mock('../llm/keys', () => ({
  resolveKey: vi.fn((provider: any) => {
    if (provider.id === 'anthropic') return 'test-anthropic-key';
    if (provider.id === 'openai') return 'test-openai-key';
    if (provider.id === 'ollama') return 'ollama';
    return null;
  }),
}));

vi.mock('../llm/ollama', () => ({
  checkOllamaRunning: vi.fn().mockResolvedValue(true),
  listOllamaModels: vi.fn().mockResolvedValue([
    { name: 'llama3:latest', size: 4000000000, parameter_size: '8B', quantization: 'Q4_0', modified_at: '2024-01-01' },
  ]),
  ollamaModelsToModelInfo: vi.fn((models: any[]) =>
    models.map(m => ({
      id: m.name,
      name: `${m.name} (${m.parameter_size})`,
      contextWindow: 32768,
      maxTokens: 4096,
      supportsThinking: false,
      supportsVision: false,
      pricing: { input: 0, output: 0 },
    }))
  ),
}));

import { resolveModel, listAllModels } from '../llm/resolve';
import { resolveKey } from '../llm/keys';

const defaultConfig = {
  model: 'anthropic/claude-sonnet-4-20250514',
  effort: 'high',
  permissions: 'confirm',
  session: { dir: './.zor/sessions', compactThreshold: 160000 },
  mcp: { servers: [] },
};

describe('resolveModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns provider and model for known provider', async () => {
    const result = await resolveModel(defaultConfig);
    expect(result.provider.id).toBe('anthropic');
    expect(result.model.id).toBe('claude-sonnet-4-20250514');
    expect(result.apiKey).toBe('test-anthropic-key');
  });

  it('throws for unknown provider', async () => {
    const config = { ...defaultConfig, model: 'unknown/model-v1' };
    await expect(resolveModel(config)).rejects.toThrow('Unknown provider');
  });

  it('resolves model without provider prefix', async () => {
    const config = { ...defaultConfig, model: 'gpt-5' };
    const result = await resolveModel(config);
    expect(result.provider.id).toBe('openai');
    expect(result.model.id).toBe('gpt-5');
  });

  it('throws when model not found in provider', async () => {
    const config = { ...defaultConfig, model: 'anthropic/nonexistent-model' };
    await expect(resolveModel(config)).rejects.toThrow('not found');
  });

  it('throws when no API key available', async () => {
    vi.mocked(resolveKey).mockReturnValueOnce(null);
    const config = { ...defaultConfig, model: 'openai/gpt-5' };
    await expect(resolveModel(config)).rejects.toThrow('No API key');
  });

  it('resolves ollama model when provider is ollama', async () => {
    const config = { ...defaultConfig, model: 'ollama/llama3:latest' };
    const result = await resolveModel(config);
    expect(result.provider.id).toBe('ollama');
    expect(result.model.id).toBe('llama3:latest');
  });
});

describe('listAllModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates models from all providers', async () => {
    const models = await listAllModels();
    const anthropicModels = models.filter(m => m.providerId === 'anthropic');
    const openaiModels = models.filter(m => m.providerId === 'openai');
    expect(anthropicModels.length).toBeGreaterThan(0);
    expect(openaiModels.length).toBeGreaterThan(0);
  });

  it('includes provider name in results', async () => {
    const models = await listAllModels();
    for (const model of models) {
      expect(model.providerName).toBeDefined();
      expect(typeof model.providerName).toBe('string');
    }
  });

  it('includes ollama models when running', async () => {
    const models = await listAllModels();
    const ollamaModels = models.filter(m => m.providerId === 'ollama');
    expect(ollamaModels.length).toBeGreaterThan(0);
  });
});