# Frontends and satellites

## Open WebUI (`webui`)

Default frontend. Port `33801`. First boot creates a local admin account in the browser. First start also downloads embedding and Whisper weights; the healthcheck can take several minutes.

```bash
harbor up                      # includes webui
harbor up webui
harbor webui version main
harbor webui name "My AI"
harbor webui secret
harbor webui log DEBUG
harbor env webui ENABLE_REALTIME_CHAT_SAVE false
```

Harbor merges integration JSON into WebUI config on start. Persistent overrides belong in `$(harbor home)/services/webui/configs/config.override.json` (applied last). UI-only settings can be overwritten on restart.

When started together, these auto-wire into WebUI:

| Service | Role |
|---------|------|
| `llamacpp`, `ollama`, `vllm`, `dmr`, `mlx`, `omlx`, `ikllamacpp`, ... | Inference |
| `searxng` | Web search / Web RAG |
| `speaches` | TTS / STT |
| `openterminal` | Terminal + notebooks |
| `comfyui` | Image generation |
| `pipelines` | Open WebUI pipelines |
| `metamcp` + `mcpo` | MCP tools |
| `cognee` | Knowledge graph (MCP) |

If a satellite starts after WebUI, `harbor restart webui` so the merger re-runs.

| Key | Default |
|-----|---------|
| `webui.host.port` | `33801` |
| `webui.secret` | `h@rb0r` |
| `webui.name` | `Harbor` |
| `webui.log.level` | `INFO` |
| `webui.version` | `main` |

`ui.main` selects which service `harbor open` / `harbor qr` target (default `webui`). `ui.autoopen` opens that UI after `harbor up`.

## SearXNG (`searxng`)

Port `33811`. Auto-connects to `webui`, `ldr`, `chatui`, `chatnio`, `perplexica`, `anythingllm`.

```bash
harbor up searxng
harbor restart webui            # if webui was already up
harbor url searxng
harbor config set searxng.internal_url http://external:8080
```

Config files live in `$(harbor home)/services/searxng/` (`settings.yml`, `limiter.toml`). Workspace key: `searxng.workspace` = `./services/searxng`.

## Speaches (`speaches`)

Port `34331`. OpenAI-compatible TTS/STT. Auto-becomes WebUI speech backend when both run. First start pre-pulls default STT/TTS models via a companion container.

```bash
harbor up speaches
harbor restart webui
```

Needs CUDA 12.6+ for the NVIDIA image. `nvidia-smi` to check. Permission errors on the shared HF cache: `harbor fixfs`.

## Open Terminal (`openterminal`)

Port `34771`. Remote shell + notebooks for agents. WebUI gets a system connection with the shared bearer token when both run.

```bash
harbor up openterminal
harbor config get openterminal.api.key
curl http://localhost:34771/health
```

Filesystem:

- `/home/user` — Harbor sandbox (`openterminal.workspace` = `./services/openterminal/data`)
- `/workspace/host` — opt-in host folder (`openterminal.host.workspace`)
- Docker socket — opt-in (`openterminal.docker.socket`)

```bash
harbor config set openterminal.packages "ripgrep fd-find jq"
harbor config set openterminal.pip_packages "httpx polars"
harbor config set openterminal.host.workspace /absolute/path/to/project
harbor config set openterminal.docker.socket true
harbor restart openterminal
```

Empty `openterminal.api.key` is generated on first start. Docs: `http://localhost:34771/docs`.

## Access

```bash
harbor url webui
harbor url --lan webui
harbor url --internal webui     # also -i
harbor qr webui
harbor tunnel webui             # temporary cloudflared
harbor tunnel down
harbor tunnels add webui        # auto-tunnel on harbor up
```

Do not expose an unauthenticated UI to the internet.

## Volumes

```bash
harbor volumes ls
harbor volumes add ollama /data/models:/root/.ollama
harbor volumes rm ollama 0
```
