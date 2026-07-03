import { describe, it, expect } from 'vitest';

import { PROVIDERS, getAllProviders, getProvider } from '../llm/providers';

describe('getAllProviders', () => {
  it('returns 27 providers (19 original + 8 new)', () => {
    const providers = getAllProviders();
    expect(providers).toHaveLength(27);
  });

  it('each provider has id, name, models, envKey', () => {
    const providers = getAllProviders();
    for (const provider of providers) {
      expect(typeof provider.id).toBe('string');
      expect(provider.id.length).toBeGreaterThan(0);
      expect(typeof provider.name).toBe('string');
      expect(provider.name.length).toBeGreaterThan(0);
      expect(Array.isArray(provider.models)).toBe(true);
      expect(typeof provider.envKey).toBe('string');
    }
  });

  it('Anthropic provider exists', () => {
    const anthropic = getProvider('anthropic');
    expect(anthropic).toBeDefined();
    expect(anthropic!.name).toBe('Anthropic');
    expect(anthropic!.api).toBe('anthropic');
    expect(anthropic!.envKey).toBe('ANTHROPIC_API_KEY');
    expect(anthropic!.models.length).toBeGreaterThan(0);
  });

  it('Ollama provider exists', () => {
    const ollama = getProvider('ollama');
    expect(ollama).toBeDefined();
    expect(ollama!.name).toBe('Ollama (Local)');
    expect(ollama!.api).toBe('ollama');
  });

  it('OpenCode Go provider exists', () => {
    const opencode = getProvider('opencode');
    expect(opencode).toBeDefined();
    expect(opencode!.name).toBe('OpenCode Go');
    expect(opencode!.api).toBe('custom');
    expect(opencode!.envKey).toBe('OPENCODE_API_KEY');
    expect(opencode!.models.length).toBeGreaterThan(0);
  });

  it('no duplicate provider IDs', () => {
    const providers = getAllProviders();
    const ids = providers.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('each model has required fields', () => {
    const providers = getAllProviders();
    for (const provider of providers) {
      for (const model of provider.models) {
        expect(typeof model.id).toBe('string');
        expect(typeof model.name).toBe('string');
        expect(typeof model.contextWindow).toBe('number');
        expect(typeof model.maxTokens).toBe('number');
        expect(typeof model.supportsThinking).toBe('boolean');
        expect(typeof model.supportsVision).toBe('boolean');
        expect(model.pricing).toBeDefined();
        expect(typeof model.pricing.input).toBe('number');
        expect(typeof model.pricing.output).toBe('number');
      }
    }
  });

  it('returns PROVIDERS array directly', () => {
    expect(getAllProviders()).toBe(PROVIDERS);
  });

  it('OpenAI provider has GPT models', () => {
    const openai = getProvider('openai');
    expect(openai).toBeDefined();
    const gpt5 = openai!.models.find(m => m.id === 'gpt-5');
    expect(gpt5).toBeDefined();
    expect(gpt5!.contextWindow).toBe(128000);
  });

  it('Google provider has Gemini models', () => {
    const google = getProvider('google');
    expect(google).toBeDefined();
    const geminiPro = google!.models.find(m => m.id === 'gemini-2.5-pro');
    expect(geminiPro).toBeDefined();
    expect(geminiPro!.contextWindow).toBe(1000000);
  });

  it('getProvider returns undefined for unknown ID', () => {
    expect(getProvider('nonexistent')).toBeUndefined();
  });
});
