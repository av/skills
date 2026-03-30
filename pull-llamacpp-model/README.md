# pull-llamacpp-model

Use when pulling or downloading a new llamacpp model. The active ROCm image (kyuz0/amd-strix-halo-toolboxes) fails to start in the ephemeral pull container without ROCm device access. Must temporarily switch to the standard CPU image.

```bash
npx skills add av/skills --skill pull-llamacpp-model
```
