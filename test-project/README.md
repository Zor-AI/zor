# Test Project

This is a Zor debugging playground.

## Files
- `src/app.ts` — buggy TypeScript with divide-by-zero + type issues
- `tests/math.test.ts` — incomplete tests with a skipped edge case
- `zor.json` — Zor config (uses opencode/claude-sonnet-4, auto permissions)
- `package.json` — minimal Node.js project

## Run Zor here
```powershell
cd C:\Users\realj\Desktop\Zor\zor
bun run packages/zor-code/src/main.tsx opencode/claude-sonnet-4
```

## Test prompts
```
fix the bugs in src/app.ts
```
```
write tests for the divide function
```
```
/use          # interactive model picker
/context      # show context usage
/keys list    # check key status
/help         # all commands
```

## Debug flags
- `ZOR_LOG_LEVEL=debug` — verbose logging
- `ZOR_DISABLE_ENCRYPTION=true` — skip session encryption (faster debug)
- `ZOR_LIVE_TEST=1 NVIDIA_API_KEY=xxx` — run live provider tests
