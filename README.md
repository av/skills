<p align="center">
  <img src="./assets/splash.png" alt="av/skills repository splash picture" width="100%">
</p>

<p align="center">
  <a href="https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Fav%2Fskills"><img src="https://api.visitorbadge.io/api/combined?path=https%3A%2F%2Fgithub.com%2Fav%2Fskills&label=visitors&countColor=%23111111&style=flat" /></a>
  <a href="https://github.com/av/harbor"><img src="https://img.shields.io/badge/av-Harbor-black.svg" alt="av/harbor repo link"></a>
  <a href="https://discord.gg/8nDRphrhSF"><img src="https://img.shields.io/badge/Discord-Harbor-blue?logo=discord&logoColor=white" alt="Discord"></a>
</p>

A library of skills made by @av related to Local LLMs, Full-Stack Development and more.

### Skills

#### **[boost-modules](./boost-modules)**
Create custom modules for [Harbor Boost](https://github.com/av/harbor/tree/main/boost), an optimizing LLM proxy. Use when building Python modules that intercept/transform LLM chat completions—reasoning chains, prompt injection, structured outputs, artifacts, or custom workflows. Triggers on requests to create Boost modules, extend LLM behavior via proxy, or implement chat completion middleware.

```bash
npx skills add av/skills --skill boost-modules
```
#### **[preact-buildless-frontend](./preact-buildless-frontend)**
Build-less ESM frontends that run directly in the browser without bundlers. Use this skill when creating static frontends, SPAs without build tools, prototypes, or when the user explicitly wants no Vite/Webpack/bundler. Covers import maps, CDN imports, cache-busting, hash routing, and performance patterns.

```bash
npx skills add av/skills --skill preact-buildless-frontend
```
#### **[run-llms](./run-llms)**
Guide for setting up and running local LLMs using Harbor. Use when user wants to run LLMs locally, set up Ollama, Open WebUI, llama.cpp, vLLM, or similar local AI services. Covers full setup from Docker prerequisites through running models, configuration, profiles, tunnels, and advanced features.

```bash
npx skills add av/skills --skill run-llms
```
