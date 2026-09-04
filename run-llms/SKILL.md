---
name: run-llms
description: Set up and run local LLMs with Harbor. Use when the user wants to run models locally, install Harbor, start Open WebUI, llama.cpp, Ollama, vLLM, Docker Model Runner, MLX, or oMLX, pull GGUF or HuggingFace models, add SearXNG web search, Speaches TTS/STT, or Open Terminal code execution, launch Codex/Claude/Grok/OpenCode against a Harbor backend, or troubleshoot GPU, VRAM, and service startup.
---

# Run LLMs locally with Harbor

Harbor is a containerized LLM toolkit. Default `harbor up` starts Open WebUI (`webui`) and llama.cpp (`llamacpp`). This skill is the operational playbook for installing Harbor, choosing a backend, pulling models, wiring search/voice/code tools, and pointing coding agents at the same stack.

For the full CLI catalog, `harbor skills get harbor`. For Boost module authoring, use the `boost-modules` skill.

## Agent rules

- `harbor logs` follows forever and will hang a non-interactive shell. Read logs with `docker logs harbor.<service>` (add `--tail 200` if needed).
- Never edit `.env` by hand. Use `harbor config get/set` and `harbor env`.
- Do not set `llamacpp.model` / `llamacpp.model.specifier` unless the user explicitly wants a single pinned GGUF. Router mode (empty specifier) discovers pulled GGUFs automatically.
- `harbor launch` options (`--backend`, `--model`, `--web`, `--workflow`, `--config`, `--service`) go **before** the tool name. Everything after the tool name is the tool's own argv.
- After `harbor update`, run `harbor config update` if new keys are missing from the local config.

## Read only what you need

| File | When |
|------|------|
| `references/models.md` | Pull, list, remove, routing, HuggingFace token/cache |
| `references/backends.md` | llamacpp, ollama, vLLM, DMR, MLX, oMLX, ikllamacpp |
| `references/stack.md` | webui, searxng, speaches, openterminal, tunnels |
| `references/launch.md` | Codex, Claude Code, Grok, OpenCode, Boost `--web`/`--workflow` |
| `references/troubleshooting.md` | GPU, OOM, won't start, UI/model missing |

## Decision trees

### User wants to run an LLM

```
1. Harbor installed? (`harbor --version`)
   → NO: install (see Initial setup)
2. Docker running? (`docker info`)
   → FAIL: start Docker
3. Platform / backend:
   → Apple Silicon Metal: dmr, mlx, or omlx (see backends.md)
   → NVIDIA/AMD Linux, unspecified: llamacpp (default) or ollama
   → HF safetensors / production serving: vllm
4. Model:
   → none specified: pull a small GGUF, then `harbor up`
     harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
     harbor up
   → Ollama tag (`qwen3.5:4b`): harbor up ollama && harbor pull <tag>
   → HF GGUF (`org/repo[:quant]`): harbor pull <spec> && harbor up llamacpp
   → safetensors: harbor vllm model <org/repo> && harbor up vllm
   → DMR/MLX/oMLX: harbor models pull --source <src> <spec> (see models.md)
5. Verify: harbor ps, harbor models ls, harbor open
```

### User wants a coding agent on a local model

```
1. Backend running or named with --backend (launch starts it if stopped)
2. harbor launch --backend <svc> --model <id> <tool>
   Common tools: codex, claude, grok, opencode
3. Need web search in the agent? add --web (not with claude)
4. Need a Boost quality/research pass? --workflow quickhop|deephop|autocheck
5. Codex + llama.cpp-family can fail on Responses API tool schema
   → use opencode with llamacpp, or Codex with ollama/vllm/dmr/mlx/omlx
See references/launch.md
```

### User wants web search in chat

```
1. harbor up searxng
2. If webui was already running: harbor restart webui
3. harbor open  → web search is wired in Open WebUI
```

### User wants code execution in chat

```
1. harbor up openterminal
2. harbor open  → Open WebUI gets a pre-wired Open Terminal connection
```

### User wants voice in chat

```
1. harbor up speaches
2. If webui was already running: harbor restart webui
```

### User wants to change the model

```
1. harbor ps  → which backend is up
2. ollama:     harbor pull <tag>  (pick in UI)
   llamacpp:   harbor pull <org/repo[:quant]>  (router discovers it)
   vllm:       harbor vllm model <org/repo> && harbor restart vllm
   dmr/mlx/omlx: harbor models pull --source <src> <spec>
3. Do not set llamacpp.model to "switch" models in router mode
```

### User has GPU issues

```
1. NVIDIA: nvidia-smi
   AMD:    rocminfo or ls /dev/kfd /dev/dri
   Apple:  use dmr/mlx/omlx (host Metal), not a Linux CUDA image
2. NVIDIA toolkit: docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
3. docker logs harbor.<backend>  → CUDA / ROCm / OOM / no GPU
4. See references/troubleshooting.md
```

## Initial setup

### Prerequisites

```bash
docker --version         # 20.10+
docker compose version   # 2.23.1+
git --version
```

Linux: add the user to `docker` (`sudo usermod -aG docker $USER`) and re-login if `docker` needs sudo.

### Install Harbor

Recommended:

```bash
curl -fsSL https://raw.githubusercontent.com/av/harbor/refs/heads/main/install.sh | bash
```

Use `| bash`, not `| sh`. Then `source ~/.bashrc` (or `~/.zshrc`) and:

```bash
harbor --version
harbor doctor
```

For an agent to install Harbor itself:

```bash
# Claude Code
curl -fsSL https://raw.githubusercontent.com/av/harbor/refs/heads/main/install.md | claude

# Codex
codex "$(curl -fsSL https://raw.githubusercontent.com/av/harbor/refs/heads/main/install.md)"
```

### First start

```bash
harbor up
```

Expect `harbor.llamacpp` and `harbor.webui` healthy. First WebUI boot downloads embedding/Whisper weights; healthcheck grace can be several minutes.

```bash
harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor models ls
harbor open
```

Create the local Open WebUI admin account in the browser, pick the pulled GGUF, send a test message.

## Core commands

| Command | Purpose |
|---------|---------|
| `harbor up [services...]` | Start defaults plus any named services |
| `harbor up --no-defaults <svc>` | Start only what you name |
| `harbor down` | Stop stack (also stops DMR/MLX/oMLX host runners) |
| `harbor ps` | Running containers |
| `docker logs harbor.<svc>` | Safe log read for agents |
| `harbor open [svc]` | Open default UI or a named service |
| `harbor url [--lan\|--internal] <svc>` | Print URL |
| `harbor pull <svc\|model>` | Compose image pull, or smart model pull |
| `harbor models ls` / `pull` / `rm` | Cross-source model management |
| `harbor launch ... <tool>` | Host coding tool against a Harbor backend |
| `harbor restart [svc]` | Restart |
| `harbor doctor` | Diagnostics |
| `harbor config get/set/ls/search/update` | Global config |
| `harbor env <svc> [key [value]]` | Per-service `override.env` |
| `harbor defaults ls/add/rm` | Default `harbor up` set |

## Config

```bash
harbor config ls
harbor config search port
harbor config get webui.host.port
harbor config set webui.name "My AI"
harbor config update          # merge new keys from profiles/default.env
harbor env ollama             # list service overrides
harbor env ollama OLLAMA_NUM_PARALLEL 4
```

```bash
harbor defaults               # default is webui;llamacpp
harbor defaults add searxng
harbor defaults rm llamacpp
harbor defaults add ollama    # if the user wants Ollama as the default backend
```

```bash
harbor profile ls
harbor profile save mysetup
harbor profile use mysetup
harbor profile rm mysetup
```

Profiles are partial. Changes after `use` are not auto-saved.

## Common stacks

```bash
# Default chat UI + GGUF backend
harbor up
harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor open

# Ollama registry models
harbor up ollama
harbor pull qwen3.5:4b
harbor open

# Web search + voice + code execution in Open WebUI
harbor up searxng speaches openterminal
harbor open

# Apple Silicon Metal
harbor up webui mlx
# or: harbor up webui dmr
# or: harbor up webui omlx

# Coding agent on a running backend
harbor launch --backend ollama --model qwen3.5:4b codex
```

LAN URL / QR: `harbor url --lan webui`, `harbor qr webui`. Temporary internet tunnel: `harbor tunnel webui`, then `harbor tunnel down`.
