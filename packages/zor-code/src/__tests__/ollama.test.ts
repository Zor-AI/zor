import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
  checkOllamaRunning,
  listOllamaModels,
  ollamaModelsToModelInfo,
  pullOllamaModel,
  deleteOllamaModel,
} from '../llm/ollama';

describe('checkOllamaRunning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when Ollama is running', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await checkOllamaRunning();
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/tags'));
  });

  it('returns false when Ollama is not running', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await checkOllamaRunning();
    expect(result).toBe(false);
  });

  it('returns false on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await checkOllamaRunning();
    expect(result).toBe(false);
  });
});

describe('listOllamaModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns model list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'llama3:latest',
            size: 4000000000,
            details: { parameter_size: '8B', quantization_level: 'Q4_0' },
            modified_at: '2024-01-01T00:00:00Z',
          },
        ],
      }),
    });

    const models = await listOllamaModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('llama3:latest');
    expect(models[0].parameter_size).toBe('8B');
    expect(models[0].quantization).toBe('Q4_0');
  });

  it('returns empty list on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));
    const models = await listOllamaModels();
    expect(models).toEqual([]);
  });

  it('returns empty list on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const models = await listOllamaModels();
    expect(models).toEqual([]);
  });
});

describe('ollamaModelsToModelInfo', () => {
  it('converts model format', () => {
    const input = [
      { name: 'llama3:latest', parameter_size: '8B' },
      { name: 'codellama:7b', parameter_size: '7B' },
    ];

    const result = ollamaModelsToModelInfo(input);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('llama3:latest');
    expect(result[0].name).toBe('llama3:latest (8B)');
    expect(result[0].contextWindow).toBe(32768);
    expect(result[0].maxTokens).toBe(4096);
    expect(result[0].supportsThinking).toBe(false);
    expect(result[0].pricing).toEqual({ input: 0, output: 0 });
  });

  it('returns empty array for empty input', () => {
    expect(ollamaModelsToModelInfo([])).toEqual([]);
  });
});

describe('pullOllamaModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success on pull', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await pullOllamaModel('llama3:latest');
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/pull'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns failure on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await pullOllamaModel('llama3:latest');
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('returns failure on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));
    const result = await pullOllamaModel('llama3:latest');
    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });
});

describe('deleteOllamaModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true on successful delete', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await deleteOllamaModel('llama3:latest');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/delete'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('returns false on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await deleteOllamaModel('llama3:latest');
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await deleteOllamaModel('llama3:latest');
    expect(result).toBe(false);
  });
});

describe('OLLAMA_HOST validation', () => {
  it('invalid URL falls back to default', async () => {
    const original = process.env.OLLAMA_HOST;
    process.env.OLLAMA_HOST = 'not-a-valid-url';
    vi.resetModules();

    const ollama = await import('../llm/ollama');
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await ollama.checkOllamaRunning();
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');

    if (original !== undefined) {
      process.env.OLLAMA_HOST = original;
    } else {
      delete process.env.OLLAMA_HOST;
    }
  });

  it('blocked host falls back to default', async () => {
    const original = process.env.OLLAMA_HOST;
    process.env.OLLAMA_HOST = 'http://169.254.169.254:11434';
    vi.resetModules();

    const ollama = await import('../llm/ollama');
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await ollama.checkOllamaRunning();
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');

    if (original !== undefined) {
      process.env.OLLAMA_HOST = original;
    } else {
      delete process.env.OLLAMA_HOST;
    }
  });
});
