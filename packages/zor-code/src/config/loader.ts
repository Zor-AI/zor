import { Value } from '@sinclair/typebox/value';
import { ZorConfigSchema, defaultConfig, type ZorConfig } from '../config';
import * as fs from 'fs';
import * as path from 'path';

function homeDir(): string {
  return process.env.USERPROFILE || process.env.HOME || process.cwd();
}

export function loadConfig(configPath?: string): ZorConfig {
  const searchPaths = configPath
    ? [configPath]
    : [
        path.join(process.cwd(), 'zor.json'),
        path.join(process.cwd(), '.zor', 'zor.json'),
        path.join(homeDir(), '.zor', 'zor.json'),
      ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const merged = { ...defaultConfig, ...raw };
        if (!Value.Check(ZorConfigSchema, merged)) {
          const errors = [...Value.Errors(ZorConfigSchema, merged)];
          const msg = errors.map(e => `  ${e.path}: ${e.message}`).join('\n');
          console.error(`Invalid config at ${p}:\n${msg}\nUsing defaults.`);
          continue;
        }
        return merged as ZorConfig;
      } catch (e: any) {
        if (e instanceof SyntaxError) {
          console.error(`Invalid JSON at ${p}: ${e.message}`);
        }
        continue;
      }
    }
  }
  return defaultConfig;
}