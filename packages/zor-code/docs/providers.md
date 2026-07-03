# Provider Configuration

Zor supports 19+ LLM providers. Each uses standard `provider/model` format (e.g., `anthropic/claude-sonnet-4-20250514`).

## Setting API Keys

Two options:

```bash
# 1. Environment variable (recommended for CI/CD)
export ANTHROPIC_API_KEY=sk-ant-xxxx

# 2. Persistent storage (for terminal use)
zor-code keys set anthropic sk-ant-xxxx
```

Stored keys saved to `~/.zor/keys.json` with `0o600`.

## Provider Reference

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
zor-code keys set anthropic <key>
```

| Model ID | Name | Context | Thinking |
|----------|------|---------|----------|
| `claude-opus-4-20250514` | Claude Opus 4 | 200k | Yes |
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | 200k | Yes |
| `claude-haiku-3-20240307` | Claude Haiku 3 | 200k | No |

Base URL: `https://api.anthropic.com`

### OpenAI

```bash
export OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

| Model ID | Context | Thinking |
|----------|---------|----------|
| `gpt-5` | 128k | No |
| `gpt-5-mini` | 128k | No |
| `o3` | 200k | Yes |
| `o4-mini` | 200k | Yes |

Base URL: `https://api.openai.com/v1`

### Google Gemini

```bash
export GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxx
```

| Model ID | Context | Thinking |
|----------|---------|----------|
| `gemini-2.5-pro` | 1M | Yes |
| `gemini-2.5-flash` | 1M | Yes |
| `gemini-2.0-flash` | 1M | No |

Base URL: `https://generativelanguage.googleapis.com/v1beta`

### DeepSeek

```bash
export DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
```

| Model ID | Context | Thinking |
|----------|---------|----------|
| `deepseek-v4-flash` | 64k | Yes |
| `deepseek-v4-pro` | 64k | Yes |

Base URL: `https://api.deepseek.com`

### OpenRouter

Meta-provider. Proxies many models through a single key.

```bash
export OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

| Model ID |
|----------|
| `anthropic/claude-sonnet-4` |
| `meta-llama/llama-4-maverick` |
| `qwen/qwen3-235b-a22b` |
| `deepseek/deepseek-v4-pro` |
| `google/gemini-2.5-pro` |

Base URL: `https://openrouter.ai/api/v1`

### Groq

```bash
export GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

| Model ID | Context |
|----------|---------|
| `llama-3.3-70b-versatile` | 128k |
| `llama-3.1-8b-instant` | 128k |
| `qwen/qwen3-32b` | 128k |

Base URL: `https://api.groq.com/openai/v1`

### Mistral

```bash
export MISTRAL_API_KEY=xxxxxxxxxxxx
```

| Model ID | Context |
|----------|---------|
| `mistral-large-latest` | 128k |
| `codestral-latest` | 256k |

Base URL: `https://api.mistral.ai/v1`

### xAI (Grok)

```bash
export XAI_API_KEY=xai-xxxxxxxxxxxx
```

| Model ID | Context |
|----------|---------|
| `grok-3` | 131k |
| `grok-build-0.1` | 131k |

Base URL: `https://api.x.ai/v1`

### Together AI

```bash
export TOGETHER_API_KEY=xxxxxxxxxxxx
```

| Model ID | Context |
|----------|---------|
| `meta-llama/Llama-3.3-70B-Instruct-Turbo` | 128k |
| `deepseek-ai/DeepSeek-V4-Pro` | 64k |
| `Qwen/Qwen3.6-Plus` | 128k |

Base URL: `https://api.together.xyz/v1`

### NVIDIA NIM

```bash
export NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx
```

| Model ID | Context |
|----------|---------|
| `nvidia/nemotron-3-super-120b-a12b` | 128k |
| `meta/llama-3.3-70b-instruct` | 128k |

Base URL: `https://integrate.api.nvidia.com/v1`

### Other Providers

| Provider | Env Key | Base URL |
|----------|---------|----------|
| Perplexity | `PERPLEXITY_API_KEY` | `https://api.perplexity.ai` |
| Cohere | `COHERE_API_KEY` | `https://api.cohere.com/v2` |
| Cerebras | `CEREBRAS_API_KEY` | `https://api.cerebras.ai/v1` |
| Novita AI | `NOVITA_API_KEY` | `https://api.novita.ai/v3/openai` |
| Fireworks | `FIREWORKS_API_KEY` | `https://api.fireworks.ai/inference/v1` |
| DeepInfra | `DEEPINFRA_API_KEY` | `https://api.deepinfra.com/v1/openai` |
| MiniMax | `MINIMAX_API_KEY` | `https://api.minimax.chat/v1` |
| OpenCode Go | `OPENCODE_API_KEY` | `https://opencode.ai/zen` |

### Ollama (Local)

No API key. Uses models you've pulled locally.

```bash
# Pull a model
ollama pull qwen2.5-coder:14b

# List local models
zor-code /ollama

# Switch to local model
/model ollama/qwen2.5-coder:14b
```

Models auto-detected from running Ollama instance. Supports custom `OLLAMA_HOST` env.

## Switching Models

```bash
# In TUI
/model anthropic/claude-sonnet-4-20250514
/model openai/gpt-5
/model opencode/claude-sonnet-4

# CLI argument
zor-code nvidia/nemotron-3-super-120b-a12b

# Interactive picker
/use
```
