import { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import { Type } from '@sinclair/typebox';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { ToolSearch } from './tools/search';
import { webFetchTool } from './tools/webfetch';
import { taskTool } from './subagent';

function result(text: string, details?: any): AgentToolResult<any> {
  return { content: [{ type: 'text' as const, text }], details: details || {} };
}

function validatePath(filepath: string, projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  const resolved = path.resolve(root, filepath);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error(`Path traversal blocked: "${filepath}" resolves outside project root`);
  }
  return resolved;
}

function readFileContent(filepath: string, offset = 0, limit = 2000): string {
  const safePath = validatePath(filepath);
  const content = fs.readFileSync(safePath, 'utf8');
  const lines = content.split('\n');
  const selected = lines.slice(offset, offset + limit);
  return selected.join('\n') + (selected.length < lines.length ? `\n... (${lines.length - offset - selected.length} more lines)` : '');
}

const coreTools: AgentTool[] = [
  {
    name: 'Bash',
    label: 'bash',
    description: 'Execute shell commands in the project directory.',
    parameters: Type.Object({ command: Type.String({ description: 'Shell command to execute' }) }),
    execute: async (_id, params) => {
      try {
        const stdout = execSync(params.command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 });
        return result(stdout || 'Command completed');
      } catch (e: any) {
        return result(e.stdout?.toString() || e.stderr?.toString() || `exit code ${e.status ?? 1}`, { isError: true });
      }
    },
  },
  {
    name: 'Read',
    label: 'read',
    description: 'Read file contents (max 2000 lines). Use offset to read specific sections.',
    parameters: Type.Object({
      filepath: Type.String({ description: 'File path relative to project root' }),
      offset: Type.Optional(Type.Number({ description: 'Starting line (0-indexed)' })),
      limit: Type.Optional(Type.Number({ description: 'Max lines to read' })),
    }),
    execute: async (_id, params) => {
      try {
        const content = readFileContent(params.filepath, params.offset || 0, params.limit || 2000);
        return result(content);
      } catch (e: any) {
        return result(`Error: ${e.message}`, { isError: true });
      }
    },
  },
  {
    name: 'Write',
    label: 'write',
    description: 'Create or overwrite a file. Creates parent directories if needed.',
    parameters: Type.Object({
      filepath: Type.String({ description: 'File path' }),
      content: Type.String({ description: 'File content' }),
    }),
    execute: async (_id, params) => {
      try {
        const safePath = validatePath(params.filepath);
        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, params.content, 'utf8');
        return result(`Written ${safePath} (${params.content.length} bytes)`);
      } catch (e: any) {
        return result(`Error: ${e.message}`, { isError: true });
      }
    },
  },
  {
    name: 'Edit',
    label: 'edit',
    description: 'Edit a file by finding and replacing exact text.',
    parameters: Type.Object({
      filepath: Type.String({ description: 'File path' }),
      oldString: Type.String({ description: 'Text to find (exact match)' }),
      newString: Type.String({ description: 'Replacement text' }),
    }),
    execute: async (_id, params) => {
      try {
        const safePath = validatePath(params.filepath);
        const content = fs.readFileSync(safePath, 'utf8');
        if (!content.includes(params.oldString)) {
          return result(`Error: String not found in ${params.filepath}`, { isError: true });
        }
        const newContent = content.replace(params.oldString, params.newString);
        fs.writeFileSync(safePath, newContent, 'utf8');
        return result(`Edited ${params.filepath}`);
      } catch (e: any) {
        return result(`Error: ${e.message}`, { isError: true });
      }
    },
  },
  {
    name: 'Glob',
    label: 'glob',
    description: 'Find files by glob pattern (e.g., **/*.ts, src/**).',
    parameters: Type.Object({
      pattern: Type.String({ description: 'Glob pattern' }),
    }),
    execute: async (_id, params) => {
      try {
        const { globSync } = await import('glob');
        const files = globSync(params.pattern, { nodir: true, cwd: process.cwd(), absolute: false }).slice(0, 200);
        return result(files.length > 0 ? files.join('\n') : 'No files found');
      } catch (e: any) {
        return result(`Glob error: ${e.message}`, { isError: true });
      }
    },
  },
  {
    name: 'Grep',
    label: 'grep',
    description: 'Search file contents with regular expression.',
    parameters: Type.Object({
      pattern: Type.String({ description: 'Regex pattern' }),
      include: Type.Optional(Type.String({ description: 'File glob filter (e.g., *.ts)' })),
    }),
    execute: async (_id, params) => {
      try {
        const args = ['--line-number', '--with-filename', params.pattern];
        if (params.include) args.push('--include', params.include);
        const proc = spawnSync('rg', [...args, '.'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        if (proc.error) {
          if (process.platform === 'win32') {
            try {
              const psArgs = ['-Command', `Select-String -Path * -Pattern '${params.pattern.replace(/'/g, "''")}' -Recurse | Select-Object -First 100 | ForEach-Object { $_.Filename + ':' + $_.LineNumber + ':' + $_.Line }`];
              if (params.include) {
                const ext = params.include.replace('*.', '');
                psArgs[1] = `Select-String -Path *.${ext} -Pattern '${params.pattern.replace(/'/g, "''")}' -Recurse | Select-Object -First 100 | ForEach-Object { $_.Filename + ':' + $_.LineNumber + ':' + $_.Line }`;
              }
              const psProc = spawnSync('powershell', psArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
              if (psProc.error) {
                return result('Grep requires ripgrep installed: https://github.com/BurntSushi/ripgrep');
              }
              const lines = (psProc.stdout || '').trim().split('\n').slice(0, 100);
              return result(lines.length > 0 ? lines.join('\n') : 'No matches');
            } catch {}
          }
          return result('Grep requires ripgrep installed: https://github.com/BurntSushi/ripgrep');
        }
        const lines = (proc.stdout || '').trim().split('\n').slice(0, 100);
        return result(lines.length > 0 ? lines.join('\n') : 'No matches');
      } catch {
        return result('Grep requires ripgrep installed: https://github.com/BurntSushi/ripgrep');
      }
    },
  },
  {
    name: 'Ls',
    label: 'ls',
    description: 'List directory contents.',
    parameters: Type.Object({
      filepath: Type.String({ description: 'Directory path', default: '.' }),
    }),
    execute: async (_id, params) => {
      try {
        const safePath = validatePath(params.filepath);
        const entries = fs.readdirSync(safePath, { withFileTypes: true });
        const lines = entries.map((e: fs.Dirent) => {
          const suffix = e.isDirectory() ? '/' : '';
          let size = '';
          if (e.isFile()) {
            try { size = ` (${fs.statSync(path.join(safePath, e.name)).size}b)`; } catch {}
          }
          return `${e.name}${suffix}${size}`;
        });
        return result(lines.join('\n'));
      } catch (e: any) {
        return result(`Error: ${e.message}`, { isError: true });
      }
    },
  },
];

export function buildToolSet(config: any, mcpClient: any): AgentTool[] {
  const mcpTools = mcpClient.getTools();
  return [...coreTools, ToolSearch(mcpClient), taskTool, ...mcpTools, webFetchTool];
}