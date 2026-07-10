import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import type { ProviderConfig } from './providers';

export interface CustomProviderConfig {
  id: string;
  name: string;
  api: string;
  baseUrl: string;
  envKey: string;
  models: Array<{
    id: string;
    name: string;
    contextWindow?: number;
    maxTokens?: number;
    supportsThinking?: boolean;
    supportsVision?: boolean;
    pricing?: { input: number; output: number };
  }>;
}

function expandPath(p: string): string {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return resolve(p);
}

export function loadCustomProviders(configPath: string): CustomProviderConfig[] {
  const path = expandPath(configPath);
  if (!existsSync(path)) return [];

  try {
    const content = readFileSync(path, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data.providers) ? data.providers : [];
  } catch {
    return [];
  }
}

export function mergeCustomProviders(builtIn: ProviderConfig[], custom: CustomProviderConfig[]): ProviderConfig[] {
  const merged = [...builtIn];
  
  for (const cp of custom) {
    const existingIdx = merged.findIndex(p => p.id === cp.id);
    const provider: ProviderConfig = {
      id: cp.id,
      name: cp.name,
      api: cp.api as any,
      baseUrl: cp.baseUrl,
      envKey: cp.envKey,
      models: cp.models.map(m => ({
        id: m.id,
        name: m.name,
        contextWindow: m.contextWindow || 32768,
        maxTokens: m.maxTokens || 4096,
        supportsThinking: m.supportsThinking || false,
        supportsVision: m.supportsVision || false,
        pricing: m.pricing || { input: 0, output: 0 },
      })),
      source: 'custom',
    };
    
    if (existingIdx >= 0) {
      merged[existingIdx] = provider;
    } else {
      merged.push(provider);
    }
  }
  
  return merged;
}

export function validateCustomProvider(provider: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!provider.id || typeof provider.id !== 'string') errors.push('Missing or invalid id');
  if (!provider.name || typeof provider.name !== 'string') errors.push('Missing or invalid name');
  if (!provider.api || typeof provider.api !== 'string') errors.push('Missing or invalid api');
  if (!provider.baseUrl || typeof provider.baseUrl !== 'string') errors.push('Missing or invalid baseUrl');
  if (!provider.envKey || typeof provider.envKey !== 'string') errors.push('Missing or invalid envKey');
  if (!Array.isArray(provider.models) || provider.models.length === 0) errors.push('Missing or empty models array');
  
  for (const [i, m] of (provider.models || []).entries()) {
    if (!m.id || typeof m.id !== 'string') errors.push(`Model ${i}: missing id`);
    if (!m.name || typeof m.name !== 'string') errors.push(`Model ${i}: missing name`);
  }
  
  return { valid: errors.length === 0, errors };
}