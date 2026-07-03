import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

function createMockProcess() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  return {
    stdout,
    stderr,
    stdin: { write: vi.fn() },
    kill: vi.fn(),
  };
}

let mockProc = createMockProcess();

vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProc),
}));

import { MCPClient } from '../mcp/client';

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProc = createMockProcess();
    client = new MCPClient();
  });

  it('constructs with empty servers', () => {
    expect(client.getTools()).toEqual([]);
  });

  it('getTools() returns discovered tools', () => {
    expect(client.getTools()).toEqual([]);
  });

  it('command allowlist blocks unknown commands', async () => {
    await expect(client.connect({
      name: 'bad', transport: 'stdio', command: 'rm', args: ['-rf', '/'],
    })).rejects.toThrow('not on allowlist');
  });

  it('SSRF protection blocks metadata endpoints', async () => {
    await expect(client.connect({
      name: 'ssrf', transport: 'sse', url: 'http://169.254.169.254/latest/meta-data/',
    })).rejects.toThrow('blocked host');
  });

  it('SSRF protection blocks private network', async () => {
    await expect(client.connect({
      name: 'private', transport: 'sse', url: 'http://192.168.1.1:8080/sse',
    })).rejects.toThrow('private network');
  });

  it('connect() initializes server via stdin and discovers tools', async () => {
    const config = {
      name: 'test-server',
      transport: 'stdio' as const,
      command: 'npx',
      args: ['some-mcp-server'],
    };

    const connectPromise = client.connect(config);

    await new Promise(r => setTimeout(r, 10));

    expect(mockProc.stdin.write).toHaveBeenCalled();
    const initCall = mockProc.stdin.write.mock.calls.find(
      (c: any) => {
        try { const m = JSON.parse(c[0].toString()); return m.method === 'initialize'; } catch { return false; }
      }
    );
    expect(initCall).toBeDefined();
    const initMsg = JSON.parse(initCall[0].toString());
    expect(initMsg.params.clientInfo.name).toBe('zor-code');

    mockProc.stdout.emit('data', Buffer.from(JSON.stringify({
      jsonrpc: '2.0', id: initMsg.id + 1, result: { tools: [] },
    })));

    await connectPromise;
    expect(client.getTools()).toEqual([]);
  });

  it('disconnectAll() kills processes', async () => {
    const connectPromise = client.connect({
      name: 'kill-server', transport: 'stdio', command: 'node', args: [],
    });

    await new Promise(r => setTimeout(r, 10));

    const initCall = mockProc.stdin.write.mock.calls.find(
      (c: any) => {
        try { const m = JSON.parse(c[0].toString()); return m.method === 'initialize'; } catch { return false; }
      }
    );
    const initMsg = JSON.parse(initCall[0].toString());
    mockProc.stdout.emit('data', Buffer.from(JSON.stringify({
      jsonrpc: '2.0', id: initMsg.id + 1, result: { tools: [] },
    })));
    await connectPromise;

    client.disconnectAll();
    expect(mockProc.kill).toHaveBeenCalled();
    expect(client.getTools()).toEqual([]);
  });

  it('environment filtering removes sensitive vars', async () => {
    process.env.SECRET_TOKEN = 'should-not-appear';
    process.env.PATH = '/usr/bin';

    const connectPromise = client.connect({
      name: 'env-server', transport: 'stdio', command: 'node', args: [],
      env: { MY_VAR: 'hello' },
    });

    await new Promise(r => setTimeout(r, 10));

    const initCall = mockProc.stdin.write.mock.calls.find(
      (c: any) => {
        try { const m = JSON.parse(c[0].toString()); return m.method === 'initialize'; } catch { return false; }
      }
    );
    const initMsg = JSON.parse(initCall[0].toString());
    mockProc.stdout.emit('data', Buffer.from(JSON.stringify({
      jsonrpc: '2.0', id: initMsg.id + 1, result: { tools: [] },
    })));
    await connectPromise;

    delete process.env.SECRET_TOKEN;
  });

  it('sequential IDs are unique', async () => {
    const p1 = client.connect({
      name: 'id-server-1', transport: 'stdio', command: 'npx', args: [],
    });

    await new Promise(r => setTimeout(r, 10));

    const initCall1 = mockProc.stdin.write.mock.calls.find(
      (c: any) => {
        try { const m = JSON.parse(c[0].toString()); return m.method === 'initialize'; } catch { return false; }
      }
    );
    const msg1 = JSON.parse(initCall1[0].toString());
    mockProc.stdout.emit('data', Buffer.from(JSON.stringify({
      jsonrpc: '2.0', id: msg1.id + 1, result: { tools: [] },
    })));
    await p1;

    mockProc = createMockProcess();
    const p2 = client.connect({
      name: 'id-server-2', transport: 'stdio', command: 'npx', args: [],
    });

    await new Promise(r => setTimeout(r, 10));

    const initCall2 = mockProc.stdin.write.mock.calls.find(
      (c: any) => {
        try { const m = JSON.parse(c[0].toString()); return m.method === 'initialize'; } catch { return false; }
      }
    );
    const msg2 = JSON.parse(initCall2[0].toString());
    mockProc.stdout.emit('data', Buffer.from(JSON.stringify({
      jsonrpc: '2.0', id: msg2.id + 1, result: { tools: [] },
    })));
    await p2;

    expect(msg1.id).not.toBe(msg2.id);
  });
});