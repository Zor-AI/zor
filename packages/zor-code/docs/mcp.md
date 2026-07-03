# MCP Integration

Zor supports Model Context Protocol (MCP) for custom tool integrations.

## Config

Add MCP servers to your `zor.json`:

```json
{
  "mcp": {
    "servers": [
      "{\"name\":\"brave-search\",\"transport\":\"stdio\",\"command\":\"npx\",\"args\":[\"-y\",\"@anthropic/mcp-server-brave-search\"],\"env\":{\"BRAVE_API_KEY\":\"your-key\"}}"
    ]
  }
}
```

Each server entry is a JSON string matching `MCPServerConfig`:

```typescript
interface MCPServerConfig {
  name: string;          // Unique server name
  transport: 'stdio' | 'sse';
  command?: string;      // For stdio: command to run
  args?: string[];       // For stdio: command arguments
  url?: string;          // For sse: endpoint URL
  env?: Record<string, string>; // Environment variables
}
```

## Examples

### Filesystem Access

```json
{
  "name": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
}
```

### Brave Search

```json
{
  "name": "brave-search",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "your-brave-api-key"
  }
}
```

### GitHub

```json
{
  "name": "github",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "ghp_xxxxxxxx"
  }
}
```

### SQLite

```json
{
  "name": "sqlite",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db", "./data.db"]
}
```

### Custom Python Server

```json
{
  "name": "my-tool",
  "transport": "stdio",
  "command": "python",
  "args": ["./mcp-server.py"]
}
```

### SSE (Remote)

```json
{
  "name": "remote-tool",
  "transport": "sse",
  "url": "https://my-mcp-server.example.com/sse"
}
```

## Security

- **Command allowlist**: Only `npx`, `node`, `python`, `python3`, `uvx`, `bun` allowed for stdio commands
- **SSRF protection**: SSE URLs cannot point to private/loopback/internal IPs
- **Path filtering**: Tool file paths validated against project root
- **Environment isolation**: Only whitelisted env vars (`PATH`, `HOME`, `USER`, `SHELL`, `LANG`, `NODE_PATH`) passed to MCP processes

## Debugging

1. Check MCP server stderr for errors
2. Verify server starts manually: `npx -y @anthropic/mcp-server-brave-search`
3. Check that the `command` binary is on the allowlist
4. Enable log level: `ZOR_LOG_LEVEL=debug zor-code`
5. Check `debug.log` in the Zor working directory

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "not on command allowlist" | Use `npx`, `node`, `python`, `uvx`, or `bun` |
| "SSE URL points to private network" | Use public `https://` URL only |
| Server connects but no tools | Check stderr for JSON parse errors in server |
| Server crashes on startup | Run command manually, check dependencies |
| Discovery timeout | Increase `DEFAULT_TIMEOUT` in `src/mcp/client.ts` |

## Writing MCP Tools

Minimal MCP server in Python:

```python
# mcp-server.py
import sys, json

def handle(msg):
    if msg.get("method") == "initialize":
        return {"jsonrpc": "2.0", "id": msg["id"], "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "my-tool", "version": "1.0"}
        }}
    if msg.get("method") == "tools/list":
        return {"jsonrpc": "2.0", "id": msg["id"], "result": {
            "tools": [{
                "name": "hello",
                "description": "Say hello",
                "inputSchema": {
                    "type": "object",
                    "properties": {"name": {"type": "string"}},
                    "required": ["name"]
                }
            }]
        }}
    if msg.get("method") == "tools/call":
        name = msg["params"]["name"]
        args = msg["params"]["arguments"] or {}
        result = f"Hello, {args.get('name', 'world')}!"
        return {"jsonrpc": "2.0", "id": msg["id"], "result": {
            "content": [{"type": "text", "text": result}]
        }}

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    response = handle(json.loads(line))
    if response:
        print(json.dumps(response), flush=True)
```
