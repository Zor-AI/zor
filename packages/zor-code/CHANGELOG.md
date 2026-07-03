# Changelog

## 0.1.0 — 2026-07-02

### Added
- 27 LLM providers: Anthropic, OpenAI, Google, DeepSeek, OpenRouter, Groq, Mistral, xAI, Together, Perplexity, Cohere, Cerebras, Novita, NVIDIA, Fireworks, DeepInfra, MiniMax, Moonshot AI, Hugging Face, Zhipu AI, Cloudflare, GitHub Copilot, Amazon Bedrock, Azure OpenAI, Google Vertex, Ollama, OpenCode Go
- Interactive TUI with Ink (React terminal)
- Slash commands: /model, /use, /keys, /providers, /models, /ollama, /effort, /fork, /tree, /cost, /compact, /status, /clear, /more, /help, /exit
- Session persistence with fork/tree branching
- Context compaction for long conversations
- MCP stdio + SSE client with SSRF protection
- Permission gate (auto/confirm/deny) for destructive operations
- Sub-agents: explorer, reviewer, debugger, builder
- Provider aliases: sonnet, opus, gpt5, flash, etc.
- Fuzzy model matching in /model
- Provider health ping
- Circuit breaker per provider
- Retry with exponential backoff
- Structured JSON logging
- Encrypted key + session storage (AES-256-GCM)
- WebSearch (Brave) + WebFetch tools
- Windows + Unix install scripts
- GitHub Actions CI (typecheck, build, test, compile) across 3 platforms
- GitHub Actions release workflow (auto on tag push)
