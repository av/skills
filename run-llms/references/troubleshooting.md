# Troubleshooting

Read logs with `docker logs harbor.<service>` (optionally `--tail 200`). Do not run `harbor logs` from an agent shell; it follows forever.

## Services will not start

```bash
harbor ps
docker logs harbor.<service>
docker ps -a | grep harbor
harbor doctor
docker info
harbor fixfs                    # Linux volume ACLs
harbor down && harbor up
```

`harbor doctor` checks Docker, Compose 2.23.1+, disk, registry, Harbor files, NVIDIA/ROCm when present, and WSL version.

`harbor up` pre-checks host port conflicts (webui `33801`, llamacpp `33831`, ollama `33821`, ...). Inspect with `ss -tlnp` / `lsof -i`. Skip the check only with `harbor up --skip-port-check`.

WebUI first boot can sit in `starting` for several minutes while embedding/Whisper weights download. Wait for healthy before treating it as a crash.

## No GPU / CUDA / ROCm

```bash
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
cat /etc/docker/daemon.json     # nvidia runtime
sudo systemctl restart docker
harbor down && harbor up
```

AMD: `/dev/kfd` and `/dev/dri` present, ROCm capability on (`harbor config get capabilities.default`). Apple Silicon: do not debug missing CUDA; use `dmr`, `mlx`, or `omlx`.

## Model will not load / OOM

```bash
nvidia-smi                      # or equivalent
```

- Ollama: smaller quant, `harbor pull model:q4_k_m`, or `harbor ollama ctx 4096`
- llama.cpp: `harbor llamacpp args '-c 2048 --n-gpu-layers 20'` then `harbor restart llamacpp`
- vLLM: `--max-model-len 4096`, bitsandbytes quant, `--cpu-offload-gb 4`, `--enforce-eager`
- Router shows no GGUFs: pull one first (`references/models.md`), confirm specifier is empty

```bash
harbor restart <backend>
```

## Cannot open the UI

```bash
harbor ps
harbor url webui
ss -tlnp | grep 33801
harbor open
```

Direct URL is `http://localhost:33801`. Admin account issues: incognito / clear site data, then `docker logs harbor.webui`.

## Model missing in the UI

```bash
harbor models ls
harbor ollama list              # if using Ollama
# Browser refresh
# Open WebUI → Settings → Connections
docker logs harbor.webui
harbor restart webui
```

llama.cpp models appear after a GGUF pull while the service is in router mode. vLLM serves the configured `harbor vllm model`, not every file in the HF cache.

## Web search missing

```bash
harbor ps | grep searxng
docker logs harbor.searxng
harbor restart webui
harbor url searxng
```

## Slow / hanging inference

```bash
harbor top                      # nvtop
docker logs harbor.<backend>    # first load is slow
harbor ollama ps                # several models resident
```

vLLM compiles CUDA graphs on first start; wait for `Application startup complete`, or `--enforce-eager`. Check logs for CPU fallback.

## llama.cpp pull container dies on a custom GPU image

Ephemeral GGUF pulls run without GPU devices. Switch the capability image to the official CPU server, pull, restore (see `references/models.md`).

## Open Terminal sandbox reset

```bash
harbor down openterminal
rm -rf "$(harbor home)/services/openterminal/data"
harbor up openterminal
```
