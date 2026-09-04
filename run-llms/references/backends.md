# Backends

| Handle | Port | Default model path | Best for |
|--------|------|--------------------|----------|
| `llamacpp` | 33831 | GGUF via `harbor pull org/repo[:quant]` | Default. Router discovers cached GGUFs |
| `ollama` | 33821 | `harbor pull qwen3.5:4b` | Registry tags, auto resource fit |
| `vllm` | 33911 | `harbor vllm model Qwen/Qwen3.5-4B` | HF safetensors, throughput |
| `dmr` | 34920 | `harbor models pull --source dmr ai/smollm2` | Docker Model Runner, Metal on Mac |
| `mlx` | 34930 | `harbor models pull --source mlx mlx-community/Qwen3.5-4B-4bit` | mlx-lm on Apple Silicon |
| `omlx` | 34940 | `harbor models pull --source omlx mlx-community/Qwen3.5-4B-4bit` | Multi-model MLX, SSD KV cache |
| `ikllamacpp` | 33832 | Same GGUF workflow as llamacpp | llama.cpp fork, extra quants |

Open WebUI auto-connects when started together with any of these. Launch backends also include `tabbyapi`, `mistralrs`, `sglang`, `lmdeploy`, `aphrodite`, `ktransformers`, `unsloth-studio`.

## llama.cpp (`llamacpp`)

Default backend. Router mode is on when `llamacpp.model.specifier` is empty (Harbor default). Pulled GGUFs are discovered from the HuggingFace cache; extra sources are `./services/llamacpp/data/models` and `./services/llamacpp/data/models.ini`.

```bash
harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor up llamacpp
harbor llamacpp models          # loaded models, service must be up
harbor llamacpp args            # get extra server args
harbor llamacpp args '-c 4096 -ngl 99'
```

Do not set `harbor llamacpp model ...` to "add" a model. That pins a single GGUF and disables router discovery. Clear it if someone already pinned one:

```bash
harbor config set llamacpp.model.specifier ""
harbor restart llamacpp
```

Single-model mode exists (`harbor llamacpp model https://huggingface.co/user/repo/blob/main/file.gguf` or `harbor llamacpp gguf /path/to.gguf`) only when the user wants one file loaded at start.

```bash
harbor run llamacpp --server --help
harbor llamacpp build on        # build from source when images lag
harbor llamacpp build ref b5678
harbor build llamacpp
```

Images (Harbor picks by capability):

| Key | Default |
|-----|---------|
| `llamacpp.image.cpu` | `ghcr.io/ggml-org/llama.cpp:server` |
| `llamacpp.image.nvidia` | `ghcr.io/ggml-org/llama.cpp:server-cuda` |
| `llamacpp.image.rocm` | `ghcr.io/ggml-org/llama.cpp:server-rocm` |

Port: `llamacpp.host.port` = `33831`.

**AMD Strix Halo (gfx1151):** Harbor treats it as ROCm. Vulkan/RADV is the recommended llama.cpp path:

```bash
harbor config set llamacpp.image.rocm ghcr.io/ggml-org/llama.cpp:full-vulkan
harbor env llamacpp AMD_VULKAN_ICD RADV
harbor config set llamacpp.model.specifier ""
```

The `full-vulkan` image uses `--server` as the entrypoint prefix, not `llama-server`. HF cache is mounted at `/app/models`.

## Ollama (`ollama`)

```bash
harbor up ollama
harbor ollama list
harbor ollama pull qwen3.5:4b
harbor ollama run qwen3.5:4b
harbor ollama ps
harbor ollama ctx               # get
harbor ollama ctx 8192          # set (syncs to env; env does not sync back)
harbor ollama cp <src> <dst>
harbor ollama create -f mymodel.Modelfile mymodel
```

HF via Ollama: `harbor ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF:Q8_0`.

Point consumers at an external Ollama: `harbor config set ollama.internal_url http://host.docker.internal:11434` (not `localhost` from inside Compose).

| Key | Default |
|-----|---------|
| `ollama.cache` | `~/.ollama` |
| `ollama.host.port` | `33821` |
| `ollama.version` | `latest` |
| `ollama.internal.url` | `http://ollama:11434` |
| `ollama.default.models` | `nomic-embed-text:latest` |
| `ollama.context.length` | `4096` |

ROCm image tag is `:rocm` on `ollama/ollama` when the ROCm capability is on.

## vLLM (`vllm`)

Default model in the profile is `Qwen/Qwen3.5-4B`. Harbor builds a local image with bitsandbytes.

```bash
harbor vllm model Qwen/Qwen3.5-4B
harbor hf token <token>         # gated models
harbor up vllm
docker logs harbor.vllm         # wait for Application startup complete
harbor vllm args '--max-model-len 4096'
harbor vllm version v0.9.1
```

VRAM, try in order: `--max-model-len 4096`, `--load-format bitsandbytes --quantization bitsandbytes`, `--cpu-offload-gb 4`, `--enforce-eager`, `--gpu-memory-utilization 0.85`, `--device cpu`.

ROCm uses `vllm.rocm.image` / `vllm.rocm.version`, not `vllm.image`. Port: `vllm.host.port` = `33911`.

## Docker Model Runner (`dmr`)

Host-native runner (Docker Desktop, or `docker-model-plugin` on Linux) plus a Harbor Caddy proxy. Useful on Apple Silicon for Metal without running weights in Linux.

```bash
harbor up dmr
harbor up webui dmr
harbor dmr ls
harbor dmr pull ai/smollm2
harbor launch --backend dmr --model ai/smollm2 codex
```

When `dmr.manage.host` is true (default), `harbor up dmr` bootstraps missing host pieces. `harbor down dmr` stops the proxy; the host runner stays Docker-managed. Default model: `ai/smollm2`. Port: `34920`.

## MLX (`mlx`)

Host `mlx-lm` via `uv`, Harbor proxy. Apple Silicon only for acceleration. Needs `uv` on the host.

```bash
harbor up mlx
harbor mlx pull mlx-community/Qwen3.5-4B-4bit
harbor launch --backend mlx --model mlx-community/Qwen3.5-4B-4bit codex
harbor down mlx                 # stops host mlx-lm and proxy
```

`harbor mlx rm` is not supported; delete from the HF cache. Default model: `mlx-community/Qwen3.5-4B-4bit`. Port: `34930`.

## oMLX (`omlx`)

Host `omlx serve` via `uv`, Harbor proxy. Multi-model, continuous batching, SSD KV cache. macOS 15+ intended.

```bash
harbor up omlx
harbor omlx pull mlx-community/Qwen3.5-4B-4bit
harbor omlx ls
harbor launch --backend omlx --model Qwen3.5-4B-4bit codex
```

Admin UI: `http://localhost:34940/admin`. Model dir: `./services/omlx/models`. Port: `34940`. Default model name: `Qwen3.5-4B-4bit`.

## ik_llama.cpp (`ikllamacpp`)

Same GGUF/router story as `llamacpp`, different engine.

```bash
harbor pull ikllamacpp
harbor up ikllamacpp
harbor ikllamacpp args '--ctx-size 4096 -ngl 99'
harbor open ikllamacpp
```
