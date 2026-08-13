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

#### **[agent-integration-testing](./agent-integration-testing)**
Use when the user requests integration testing, feature validation, or test plan execution

```bash
npx skills add av/skills --skill agent-integration-testing
```
#### **[anneal](./anneal)**
Use when the user wants to systematically fix AI code slop — duplicated logic, over-engineering, silent error swallowing, convention drift, cargo-cult patterns, and other LLM-introduced architectural decay — over a specified duration

```bash
npx skills add av/skills --skill anneal
```
#### **[article-factory](./article-factory)**
Produce a researched long-form article from a topic prompt via an orchestrated pipeline - research agent (first-person sources, working-definition gate), narrative-architecture outline, writer/cold-reviewer loop with an explicit ACCEPT/REVISE verdict contract, then a catalog-deslop pass with a regression gate. The orchestrator dispatches subagents only; the writer never judges its own draft. Use when the user says "article factory", "write an article about X", "run the article pipeline", or asks for a researched long-form piece produced end-to-end. For essays and micro posts in the user's own voice without a research stage, use the prose skill instead.

```bash
npx skills add av/skills --skill article-factory
```
#### **[autoresearch](./autoresearch)**
Runs autonomous keep/discard experiments on a codebase to optimize a single metric for a fixed duration, in the style of karpathy/autoresearch. Use when the user says "autoresearch" (optionally with a focus, e.g. "autoresearch the optimizer"), asks to run experiments on a repo overnight, to hill-climb or optimize a metric autonomously, or points at a repo with a karpathy-style program.md.

```bash
npx skills add av/skills --skill autoresearch
```
#### **[boost-modules](./boost-modules)**
Create custom modules for [Harbor Boost](https://github.com/av/harbor/tree/main/boost), an optimizing LLM proxy. Use when building Python modules that intercept/transform LLM chat completions—reasoning chains, prompt injection, structured outputs, artifacts, or custom workflows. Triggers on requests to create Boost modules, extend LLM behavior via proxy, or implement chat completion middleware.

```bash
npx skills add av/skills --skill boost-modules
```
#### **[bugbash](./bugbash)**
Systematically explore and test any software project (CLI, API, Backend, Library, etc.) to find bugs, usability issues, and edge cases. Produces a structured report with full reproduction evidence (exact commands, inputs, logs, and tracebacks) for every issue.

```bash
npx skills add av/skills --skill bugbash
```
#### **[bughunt](./bughunt)**
Fully autonomous bug hunting pipeline — discover bugs in a scoped area using parallel subagents, independently triage each finding, fix confirmed issues with subagents, then audit all fixes against repo constraints and target platforms. Runs end-to-end without user interaction.

```bash
npx skills add av/skills --skill bughunt
```
#### **[catalog-deslop](./catalog-deslop)**
Catalog-then-fix slop removal on an existing prose draft. Parallel catalog subagents inventory four slop categories (theatrics, overwrought register, corrective antithesis, dramatic short sentences), fix subagents repair only what a catalog names, mechanical lint + frequency analysis bracket the run, and a regression gate (lint delta, word count, cold meaning check) decides whether the result ships. Use when the user says "deslop this draft", "catalog deslop", "strip the AI patterns from this file", or as the final stage of the article-factory and mosaic-writing skills. For writing or redrafting prose from scratch, use the prose skill instead - this skill only repairs an existing draft in place.

```bash
npx skills add av/skills --skill catalog-deslop
```
#### **[discipline](./discipline)**
Bulletproof agent operating protocol. 15 failure-prevention rules distilled from 120+ real sessions and 10 agent definitions. Covers fabrication, constraint tracking, verification, scoping, retry discipline, and communication. Load before any task to prevent the most common agent failure modes.

```bash
npx skills add av/skills --skill discipline
```
#### **[ideate](./ideate)**
Timeboxed ideation on a topic using propose-and-critique subagent pairs. Use when the user wants to brainstorm, explore ideas, discover features, generate options, or think through possibilities for a specified duration. Triggers on requests like "brainstorm X for 30 minutes", "ideate on X", "spend an hour thinking about X", "what features should we build", "explore options for X".

```bash
npx skills add av/skills --skill ideate
```
#### **[improve-skill](./improve-skill)**
Improve an existing agent SKILL.md through one gated cycle: select the target (default this skill), snapshot the committed baseline, diagnose against skill-design-principles plus four rubric dimensions, apply exactly one focused change, and ship only if a different agent than the author PASSes with quoted evidence. Use when the user says "improve this skill", "improve-skill", "iterate on SKILL.md", or "apply skill-design-principles to a skill". Do not use for code slop over a duration (anneal), generic timeboxed work (timeboxed-iterating), graph orchestration (workgraph), metric hill-climb on a codebase (autoresearch), or stripping slop from existing prose (catalog-deslop).

```bash
npx skills add av/skills --skill improve-skill
```
#### **[make-video](./make-video)**
>

```bash
npx skills add av/skills --skill make-video
```
#### **[mosaic-writing](./mosaic-writing)**
Assemble a finished piece from human-written fragments via an orchestrated two-loop pipeline - an assembly loop (assembler + cold reviewer) that sequences the fragments into a draft, then a polish loop (polisher + cold reviewer), then frequency analysis and a catalog-deslop pass with a regression gate. Two modes with opposite fidelity contracts - stitch mode preserves the author's exact wording, narrative mode preserves every idea but may rewrite freely. Use when the user says "mosaic", "assemble my fragments", "stitch these notes into a post", or provides a fragments file to turn into a finished piece. For writing from a topic with research, use article-factory; for prose from scratch, use the prose skill.

```bash
npx skills add av/skills --skill mosaic-writing
```
#### **[preact-buildless-frontend](./preact-buildless-frontend)**
Build-less ESM frontends that run directly in the browser without bundlers. Use this skill when creating static frontends, SPAs without build tools, prototypes, or when the user explicitly wants no Vite/Webpack/bundler. Covers import maps, CDN imports, cache-busting, hash routing, and performance patterns.

```bash
npx skills add av/skills --skill preact-buildless-frontend
```
#### **[pull-llamacpp-model](./pull-llamacpp-model)**
Use when pulling or downloading a new llamacpp model. The active ROCm image (kyuz0/amd-strix-halo-toolboxes) fails to start in the ephemeral pull container without ROCm device access. Must temporarily switch to the standard CPU image.

```bash
npx skills add av/skills --skill pull-llamacpp-model
```
#### **[run-llms](./run-llms)**
Comprehensive guide for setting up and running local LLMs using Harbor. Use when user wants to run LLMs locally, set up or troubleshoot Ollama, Open WebUI, llama.cpp, vLLM, SearXNG, Open Terminal, or similar local AI services. Covers full setup from Docker prerequisites through running models, per-service configuration, VRAM optimization, GPU troubleshooting, web search integration, code execution, profiles, tunnels, and advanced features. Includes decision trees for autonomous agent workflows and step-by-step troubleshooting playbooks.

```bash
npx skills add av/skills --skill run-llms
```
#### **[sandcastle](./sandcastle)**
Orchestrate AI coding agents (Claude Code, Codex, OpenCode) in isolated sandboxes using the @ai-hero/sandcastle SDK. Use when the user needs to (1) run agents AFK in Docker/Podman containers, (2) build multi-agent pipelines with plan-execute-review patterns, (3) run parallel agents on separate worktrees, (4) create iterative agent loops with maxIterations, (5) extract structured output from agent runs, (6) set up sandcastle in a new or existing project, or (7) write prompt files with template args and shell expressions.

```bash
npx skills add av/skills --skill sandcastle
```
#### **[superclaude](./superclaude)**
Configure and operate the Claude Code harness for large codebases. Builds CLAUDE.md hierarchies, scoped test/lint commands, file exclusions, codebase maps, hooks, skills, subagent strategies, and LSP/MCP wiring. Use when setting up Claude Code for a new repo, auditing an existing configuration, onboarding a team, or scaling from single-developer to org-wide deployment. Triggers on "set up Claude Code for this repo", "optimize my Claude Code config", "audit my CLAUDE.md", "make this codebase navigable", "configure hooks/skills/plugins".

```bash
npx skills add av/skills --skill superclaude
```
#### **[timeboxed-iterating](./timeboxed-iterating)**
Use when the user specifies a task and a duration, and the work should be done iteratively by subagents over that time period

```bash
npx skills add av/skills --skill timeboxed-iterating
```
#### **[tinygrad](./tinygrad)**
Deep learning framework development with tinygrad - a minimal tensor library with autograd, JIT compilation, and multi-device support. Use when writing neural networks, training models, implementing tensor operations, working with UOps/PatternMatcher for graph transformations, or contributing to tinygrad internals. Triggers on tinygrad imports, Tensor operations, nn modules, optimizer usage, schedule/codegen work, or device backends.

```bash
npx skills add av/skills --skill tinygrad
```
#### **[turso-db](./turso-db)**
Install, configure, and work with Turso DB — an in-process SQLite-compatible relational database engine written in Rust. Use when the user needs to (1) install Turso DB, (2) create or query databases with the tursodb CLI shell, (3) use Turso from JavaScript/Node.js via @tursodatabase/database, (4) work with vector search or embeddings in Turso, (5) set up full-text search with FTS indexes, (6) configure transactions including MVCC concurrent transactions, (7) enable encryption at rest, or (8) use Change Data Capture (CDC) for audit logging.

```bash
npx skills add av/skills --skill turso-db
```
#### **[workgraph](./workgraph)**
Orchestrate work as a cyclic directed graph of subagent-executed nodes with transition criteria on edges, budgeted cycles, and per-node gates (runtime verification, metric, or artifact). Use when the user says "workgraph", "run this as a graph", "graph this work", or when a goal has parallel branches, feedback loops, or mixed gate types that a linear loop cannot express. For chain-shaped work use timeboxed-iterating, autoresearch, or dark-factory instead.

```bash
npx skills add av/skills --skill workgraph
```
