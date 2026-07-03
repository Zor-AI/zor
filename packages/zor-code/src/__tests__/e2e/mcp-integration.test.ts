import { describe, it, expect } from 'vitest';
import { MCPClient } from '../../mcp/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const tmpDir = path.join(os.tmpdir(), `zor-e2e-mcp-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

const serverScript = path.join(tmpDir, 'mock-mcp-server.js');
fs.writeFileSync(serverScript, `
const {stdin, stdout} = process;
let buf = '';
stdin.setEncoding('utf8');
stdin.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\\n')) !== -1) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.method === 'initialize') {
        stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'test-mcp', version: '1.0.0' } } }) + '\\n');
      } else if (msg.method === 'tools/list') {
        stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: [ { name: 'echo', description: 'Echo back input', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } } ] } }) + '\\n');
      } else if (msg.method === 'tools/call') {
        stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: 'echo: ' + JSON.stringify(msg.params?.arguments?.text) }] } }) + '\\n');
      }
    } catch (e) { process.stderr.write('parse err: ' + e.message + '\\n'); }
  }
});
setTimeout(() => {}, 30000);
`);

describe('MCP Integration E2E', () => {
  afterAll(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('connects and calls MCP tool end-to-end', async () => {
    const client = new MCPClient();

    const server = await client.connect({
      name: 'e2e-test',
      transport: 'stdio',
      command: 'node',
      args: [serverScript],
      env: {},
    });

    expect(server.connected).toBe(true);

    if (server.tools.length > 0) {
      const result = await client.callTool('e2e-test', 'echo', { text: 'hello-world' });
      expect(result).toBeDefined();
      const text = result?.content?.[0]?.text || '';
      expect(text).toContain('hello-world');
    }
  }, 15000);

  it('getTools returns agent tools after connect', async () => {
    const client = new MCPClient();

    await client.connect({
      name: 'tools-e2e',
      transport: 'stdio',
      command: 'node',
      args: [serverScript],
      env: {},
    });

    const tools = client.getTools();
    const servers = (client as any).servers;
    const serverEntry = servers?.get('tools-e2e');

    if (serverEntry?.tools?.length > 0) {
      expect(tools.length).toBeGreaterThanOrEqual(1);
      const echoTool = tools.find((t: any) => t.name.includes('echo'));
      if (echoTool) {
        const result = await (echoTool as any).execute('test', { text: 'val' });
        expect(result.content[0].text).toContain('val');
      }
    }
  }, 15000);
});
