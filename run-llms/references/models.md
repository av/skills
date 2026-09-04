# Models

Primary commands: `harbor pull` and `harbor models`. `harbor pull` accepts a service handle (Compose image pull) or a model spec. If any non-flag argument is not a known service, Harbor treats the invocation as a model pull.

## Routing (`harbor pull` / `harbor models pull`)

When `--source` is omitted:

1. Query the Hugging Face Hub API for `org/repo` (the part before an optional `:tag`, 5s timeout).
2. Repo missing → Ollama `pull`.
3. Repo exists and publishes `.gguf` → ephemeral llama.cpp download into the llama.cpp cache.
4. Repo exists with no GGUF → Hugging Face CLI into the HF cache.

`harbor pull` does not accept `--source`. Use `harbor models pull --source` for DMR, MLX, or oMLX.

```bash
# Ollama registry
harbor pull qwen3.5:4b
harbor pull llama3.2:3b

# HuggingFace via Ollama
harbor pull hf.co/bartowski/gemma-2-2b-it-GGUF:Q4_K_M

# GGUF → llama.cpp cache (router discovers it)
harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor pull microsoft/Phi-3.5-mini-instruct-gguf

# safetensors → HF cache (vLLM, TGI, etc.)
harbor pull Qwen/Qwen3.5-4B

# Host backends
harbor models pull --source dmr ai/smollm2
harbor models pull --source mlx mlx-community/Qwen3.5-4B-4bit
harbor models pull --source omlx mlx-community/Qwen3.5-4B-4bit
```

Aliases: `harbor models dmr pull ...`, `harbor models mlx pull ...`, `harbor models omlx pull ...`.

GGUF pulls start an ephemeral llama.cpp container. Custom GPU images (ROCm/Vulkan toolboxes) can fail in that container because it runs with `--n-gpu-layers 0` and no device access. Temporarily point the active capability image at the official CPU server, pull, then restore:

```bash
harbor config set llamacpp.image.rocm ghcr.io/ggml-org/llama.cpp:server
harbor pull unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor config set llamacpp.image.rocm <original-image>
```

## List and remove

```bash
harbor models ls
harbor models ls --json
harbor models ls --source llamacpp
harbor models ls --source dmr

harbor models rm qwen3.5:4b
harbor models rm unsloth/Qwen3.5-4B-GGUF
harbor models rm unsloth/Qwen3.5-4B-GGUF:Q4_K_M
harbor models rm --source dmr ai/smollm2
```

Sources: `ollama` (skipped if Ollama is down), `hf` (HF hub cache), `llamacpp` (GGUF cache), `dmr` / `mlx` / `omlx` (queried by default only when their Harbor proxy is running; `--source` hits the host endpoint directly).

## HuggingFace helpers

```bash
harbor hf scan-cache
harbor hf token                 # show
harbor hf token <token>         # set (gated models)
harbor hf cachedir
harbor hf cachedir /path/to/cache
harbor hf path user/repo
harbor hf download user/repo
harbor hf download user/repo file.gguf
harbor hf find gguf gemma
harbor hf parse-url https://huggingface.co/user/repo/blob/main/file.gguf
```

`hf_transfer` is enabled for faster HF downloads. Disk use: `harbor size`. Find a GGUF on disk: `harbor find .gguf`.
