import { Type, type Static } from '@sinclair/typebox';
import { AgentTool } from '@earendil-works/pi-agent-core';
import { logger } from '../utils/logger';

export const MCPServerConfigSchema = Type.Object({
  name: Type.String(),
  transport: Type.Union([Type.Literal('stdio'), Type.Literal('sse')]),
  command: Type.Optional(Type.String()),
  args: Type.Optional(Type.Array(Type.String())),
  url: Type.Optional(Type.String()),
  env: Type.Optional(Type.Record(Type.String(), Type.String())),
});

export type MCPServerConfig = Static<typeof MCPServerConfigSchema>;

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  serverName: string;
}

export interface MCPServer {
  config: MCPServerConfig;
  process?: any;
  tools: MCPTool[];
  connected: boolean;
}

const DEFAULT_TIMEOUT = 10000;

const COMMAND_ALLOWLIST = new Set(['npx', 'node', 'python', 'python3', 'uvx', 'bun']);

const BLOCKED_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  '0.0.0.0',
]);

function validateCommand(command: string): void {
  const base = command.split('/').pop()!.split('\\').pop()!;
  if (!COMMAND_ALLOWLIST.has(base)) {
    throw new Error(`MCP command "${command}" not on allowlist. Allowed: ${[...COMMAND_ALLOWLIST].join(', ')}`);
  }
}

function validateSSEUrl(urlStr: string): void {
  let parsed: URL;
  try { parsed = new URL(urlStr); } catch { throw new Error(`Invalid SSE URL: "${urlStr}"`); }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`SSE URL must use http/https, got: ${parsed.protocol}`);
  }
  if (BLOCKED_HOSTS.has(parsed.hostname)) {
    throw new Error(`SSE URL points to blocked host: ${parsed.hostname}`);
  }
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)/.test(parsed.hostname)) {
    throw new Error(`SSE URL points to private network: ${parsed.hostname}`);
  }
}

export class MCPClient {
  private servers: Map<string, MCPServer> = new Map();
  private toolCache: Map<string, AgentTool> = new Map();
  private nextId = 0;

  private generateId(): number { return ++this.nextId; }

  async connect(config: MCPServerConfig): Promise<MCPServer> {
    const server: MCPServer = { config, tools: [], connected: false };

    if (config.transport === 'stdio') {
      server.process = await this.startStdioServer(config);
    } else if (config.transport === 'sse') {
      await this.connectSSE(config);
    }

    const tools = config.transport === 'stdio' ? await this.discoverTools(config.name) : [];
    server.tools = tools;
    server.connected = true;

    for (const tool of tools) {
      this.toolCache.set(tool.name, this.toAgentTool(tool));
    }

    this.servers.set(config.name, server);
    return server;
  }

  private async startStdioServer(config: MCPServerConfig) {
    const { spawn } = await import('child_process');
    validateCommand(config.command!);

    const safeEnvKeys = ['PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'NODE_PATH'];
    const safeEnv: Record<string, string> = {};
    for (const key of safeEnvKeys) {
      if (process.env[key]) safeEnv[key] = process.env[key]!;
    }
    Object.assign(safeEnv, config.env || {});

    const proc = spawn(config.command!, config.args || [], {
      env: safeEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (data: Buffer) => {
      this.handleMessage(config.name, data.toString());
    });

    proc.stderr.on('data', (data: Buffer) => {
      const msg = data.toString().slice(0, 1024);
      logger.warn(`MCP ${config.name} stderr`, { serverName: config.name, message: msg });
    });

    if (typeof proc.on === 'function') {
      proc.on('exit', () => {
        const server = this.servers.get(config.name);
        if (server) server.connected = false;
      });
    }

    await this.initializeServer(config.name, proc);
    return proc;
  }

  private async initializeServer(name: string, proc: any) {
    const initMsg = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'zor-code', version: '0.1.0' },
      },
    };
    proc.stdin.write(JSON.stringify(initMsg) + '\n');
  }

  private async connectSSE(config: MCPServerConfig) {
    if (!config.url) throw new Error('SSE transport requires a url');
    validateSSEUrl(config.url);
    const res = await fetch(config.url, { signal: AbortSignal.timeout(DEFAULT_TIMEOUT) });
    if (!res.ok) throw new Error(`SSE connection failed: ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('SSE body not readable');
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          this.handleMessage(config.name, line.slice(6));
        }
      }
    }
  }

  private async discoverTools(serverName: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverName);
    if (!server?.process) return [];

    const request = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tools/list',
      params: {},
    };

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        server.process.stdout.off('data', handler);
        resolve([]);
      }, 10000);

      const handler = (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === request.id) {
            clearTimeout(timer);
            server.process.stdout.off('data', handler);
            resolve((msg.result?.tools || []).map((t: any) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
              serverName,
            })));
          }
        } catch (e: any) { logger.debug(`MCP: non-matching message in discoverTools for ${serverName}`, { error: e.message }); }
      };
      server.process.stdout.on('data', handler);
      server.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  private handleMessage(_serverName: string, data: string) {
    try {
      const msg = JSON.parse(data);
      if (msg.method === 'notifications/initialized') return;
      if (msg.method === 'log/message') return;
    } catch (e: any) { logger.debug(`MCP: unparseable message from ${_serverName}`, { error: e.message }); }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverName);
    if (server?.process) {
      const request = {
        jsonrpc: '2.0',
        id: this.generateId(),
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      };
      return new Promise((resolve, reject) => {
        // ponytail: 30s timeout prevents MCP hang if server never responds
        const timer = setTimeout(() => {
          server.process.stdout.off('data', handler);
          reject(new Error(`MCP callTool timeout: ${toolName} on ${serverName} (30s)`));
        }, 30000);
        const handler = (data: Buffer) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.id === request.id) {
              clearTimeout(timer);
              server.process.stdout.off('data', handler);
              if (msg.error) reject(new Error(msg.error.message));
              else resolve(msg.result);
            }
          } catch (e: any) { logger.debug(`MCP: non-target message in callTool ${toolName}`, { error: e.message }); }
        };
        server.process.stdout.on('data', handler);
        server.process.stdin.write(JSON.stringify(request) + '\n');
      });
    }
    throw new Error(`Server ${serverName} not connected`);
  }

  private toAgentTool(mcpTool: MCPTool): AgentTool {
    return {
      name: `mcp:${mcpTool.serverName}:${mcpTool.name}`,
      label: `mcp:${mcpTool.name}`,
      description: mcpTool.description || `MCP tool from ${mcpTool.serverName}`,
      parameters: mcpTool.inputSchema || { type: 'object', properties: {} },
      execute: async (_id: string, params: any) => {
        const result = await this.callTool(mcpTool.serverName, mcpTool.name, params);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], details: {} };
      },
    };
  }

  getTools(): AgentTool[] {
    return Array.from(this.toolCache.values());
  }

  getTool(name: string): AgentTool | undefined {
    return this.toolCache.get(name);
  }

  async disconnectAll() {
    for (const [, server] of this.servers) {
      if (server.process) server.process.kill();
    }
    this.servers.clear();
    this.toolCache.clear();
  }
}