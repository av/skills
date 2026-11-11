---
name: pull-llamacpp-model
description: Use when pulling or downloading a new llamacpp model. The active ROCm image (kyuz0/amd-strix-halo-toolboxes) fails to start in the ephemeral pull container without ROCm device access. Must temporarily switch to the standard CPU image.
---

# Pull a llamacpp Model

When using a custom ROCm image such as `kyuz0/amd-strix-halo-toolboxes:rocm-7.2.4` for llamacpp inference on AMD Strix Halo / gfx1151, Harbor's pull mechanism starts an ephemeral container with `--n-gpu-layers 0`; the custom image fails in that context without ROCm device access. Use the standard CPU image just for pulling, then restore.

## Steps

### 1. Save the current image and switch to the standard CPU image

```bash
original_rocm_image="$(harbor config get llamacpp.image.rocm)"
harbor config set llamacpp.image.rocm ghcr.io/ggml-org/llama.cpp:server
```

### 2. Pull the model

```bash
harbor pull <hf-owner/model-repo:quantization>
# Examples:
harbor pull bartowski/Qwen2.5-7B-Instruct-GGUF:Q4_K_M
harbor pull unsloth/Mistral-Small-3.1-24B-Instruct-2503-GGUF:UD-Q4_K_XL
```

Harbor detects the HuggingFace model spec and routes it through llamacpp automatically.

### 3. Restore the custom image

```bash
harbor config set llamacpp.image.rocm "$original_rocm_image"
```

## Notes

- Run these steps in the same shell so `original_rocm_image` survives. Restore it even if the pull fails.
- The restore step is mandatory — without it, llamacpp will not use the GPU on the next `harbor up llamacpp`
- Extra args (e.g. `llama-server -fa 1 -dio --no-mmap -ngl 99 --no-mmproj`) are stored separately in config and are not affected
- To verify the model after pulling: `harbor llamacpp model`
- To verify the image was restored: `harbor config get llamacpp.image.rocm`
