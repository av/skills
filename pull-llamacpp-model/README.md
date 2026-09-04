<img src="../assets/logos/pull-llamacpp-model.svg" width="72" align="left" hspace="12" alt="">

# pull-llamacpp-model

Use when pulling or downloading a new llamacpp model. The active ROCm image (kyuz0/amd-strix-halo-toolboxes) fails to start in the ephemeral pull container without ROCm device access. Must temporarily switch to the standard CPU image.

```bash
npx skills add av/skills --skill pull-llamacpp-model
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
