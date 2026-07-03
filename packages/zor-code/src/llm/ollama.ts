import { ModelInfo } from './providers';

const BLOCKED_HOSTS = new Set(['169.254.169.254', 'metadata.google.internal']);

function validateOllamaUrl(urlStr: string): string {
  let parsed: URL;
  try { parsed = new URL(urlStr); } catch { throw new Error(`Invalid OLLAMA_HOST URL: "${urlStr}"`); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`OLLAMA_HOST must use http, got: ${parsed.protocol}`);
  }
  if (BLOCKED_HOSTS.has(parsed.hostname)) {
    throw new Error(`OLLAMA_HOST points to blocked host: ${parsed.hostname}`);
  }
  return parsed.origin;
}

const OLLAMA_BASE = (() => {
  const raw = process.env.OLLAMA_HOST || 'http://localhost:11434';
  try { return validateOllamaUrl(raw); } catch (e: any) {
    console.error(e.message);
    return 'http://localhost:11434';
  }
})();

export async function checkOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    return res.ok;
  } catch { return false; }
}

export async function listOllamaModels(): Promise<{ name: string; size: number; parameter_size: string; quantization: string; modified_at: string }[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size || 0,
      parameter_size: m.details?.parameter_size || 'unknown',
      quantization: m.details?.quantization_level || 'unknown',
      modified_at: m.modified_at,
    }));
  } catch { return []; }
}

export function ollamaModelsToModelInfo(models: { name: string; parameter_size: string }[]): ModelInfo[] {
  return models.map(m => ({
    id: m.name,
    name: `${m.name} (${m.parameter_size})`,
    contextWindow: 32768,
    maxTokens: 4096,
    supportsThinking: false,
    supportsVision: false,
    pricing: { input: 0, output: 0 },
  }));
}

export async function pullOllamaModel(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function deleteOllamaModel(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.ok;
  } catch { return false; }
}