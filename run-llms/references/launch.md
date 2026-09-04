# Harbor Launch

`harbor launch` starts an installed host coding tool against a Harbor OpenAI-compatible backend, from the directory you invoke it (the user's project, not Harbor's checkout).

Launch options go **before** the tool name. Everything after the tool name is passed through unchanged.

```bash
harbor launch --backend ollama --model qwen3.5:4b codex --sandbox workspace-write
```

If `--backend` is omitted, Harbor uses the first reachable running backend (defaults first). If none are up, it starts `llamacpp`. If `--backend` names a stopped service, Harbor starts it. If `--model` is omitted, Harbor picks a non-embedding model from `/v1/models`.

Supported host tools: `claude`, `codex`, `copilot`, `droid`, `grok`, `hermes`, `mi`, `openclaw`, `opencode`, `pi`, `pool`, `vscode`.

Launch backends: `ollama`, `llamacpp`, `ikllamacpp`, `vllm`, `dmr`, `mlx`, `omlx`, `tabbyapi`, `mistralrs`, `sglang`, `lmdeploy`, `aphrodite`, `ktransformers`, `unsloth-studio`.

`--service` forces the Harbor **container** of the same name (needed for `mi`, `opencode`, `openclaw`, `hermes`).

```bash
harbor launch mi -p "say hello"              # host mi CLI
harbor launch --service opencode --help      # Harbor opencode container
harbor launch --config opencode              # write adapter config, do not start the tool
```

## Codex

```bash
harbor launch --backend ollama --model qwen3.5:4b codex
harbor launch --backend dmr --model ai/smollm2 codex
harbor launch --backend mlx --model mlx-community/Qwen3.5-4B-4bit codex
```

Harbor sets a `harbor_launch` provider, the backend `/v1` base URL, and `OPENAI_API_KEY`.

Codex talks the Responses API tool schema. llama.cpp-family backends can reject it with `400 'type' of tool must be 'function'`. Harbor prints that warning. For llama.cpp, use OpenCode; for Codex, use ollama, vllm, dmr, mlx, or omlx.

## Claude Code

```bash
harbor launch --backend ollama --model qwen3.5:4b claude -p "explain this repo"
```

Claude uses Anthropic-style env vars. `--web` and `--workflow` are rejected: Boost web/workflow is OpenAI Chat Completions, Claude is Anthropic Messages. Use Codex, Grok, OpenCode, Copilot, Droid, OpenClaw, Pi, Pool, or Hermes for Boost-routed launch.

## Grok Build

```bash
harbor launch --backend ollama --model qwen3.5:4b grok -p "explain this repo"
```

Writes a temporary `[model.harbor-<backend>]` entry in `~/.grok/config.toml` (`base_url`, `model`, `env_key = "XAI_API_KEY"`), runs `grok -m harbor-<backend>`, then removes the entry when the session ends. `--web` and `--workflow` work the same as Codex.

## OpenCode

```bash
harbor launch --backend llamacpp --model Qwen3.5-4B opencode
harbor launch --config opencode
```

Uses `@ai-sdk/openai-compatible` and a `harbor-<backend>/<model>` model string. Prefers this over Codex when the backend is llama.cpp.

## Copilot and Pi

```bash
harbor launch --backend ollama --model qwen3.5:4b copilot -p "explain this repo"
harbor launch --backend ollama --model qwen3.5:4b pi
```

Pi sessions default to a workspace-specific directory unless you pass `--session-dir`, `--session`, `--resume`, or `--continue`. That keeps Pi from resuming a Harbor-checkout session when launched from another project.

## Boost: `--web` and `--workflow`

`--web` starts Boost + SearXNG, enables `web_search` and `read_url`, and points the tool at a generated `boost-web-<model>` id.

```bash
harbor launch --web --backend ollama --model qwen3.5:4b codex
```

`--workflow <module>` routes through one Boost module instead of the raw backend. SearXNG auto-starts for `quickhop` and `deephop`.

```bash
harbor launch --workflow quickhop --backend ollama --model qwen3.5:4b codex
harbor launch --workflow deephop --backend ollama --model qwen3.5:4b codex
harbor launch --workflow autocheck --backend ollama --model qwen3.5:4b opencode
```

| Workflow | Use |
|----------|-----|
| `quickhop` | Fast web research (docs, errors, release notes) |
| `deephop` | Two-hop research (migrations, breaking changes) |
| `autocheck` | Draft → audit → optional revise on coding deliverable turns |

`--web` and `--workflow` cannot be combined. Neither works with `claude`.

`autocheck` needs a workspace bind on Boost if you want path grounding:

```bash
harbor config set boost.workspace "$(pwd)"
harbor config set boost.workspace.root /workspace
```

For custom Boost modules, use the `boost-modules` skill.
