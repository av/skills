<p align="center">
  <img src="./assets/splash.png" alt="av/skills repository splash picture" width="100%">
</p>

<p align="center">
  <a href="https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Fav%2Fskills"><img src="https://api.visitorbadge.io/api/combined?path=https%3A%2F%2Fgithub.com%2Fav%2Fskills&label=visitors&countColor=%23111111&style=flat" /></a>
  <a href="https://github.com/av/harbor"><img src="https://img.shields.io/badge/av-Harbor-black.svg" alt="av/harbor repo link"></a>
  <a href="https://discord.gg/8nDRphrhSF"><img src="https://img.shields.io/badge/Discord-Harbor-blue?logo=discord&logoColor=white" alt="Discord"></a>
</p>

A library of agent skills by [@av](https://github.com/av) for **Claude Code**, **Codex**, **OpenCode**, **Cursor** and other coding agents — autonomous orchestration, code quality, local LLMs, and writing pipelines.

### Install

```bash
npx skills add av/skills --skill <name>
```

Skills are plain folders containing a `SKILL.md`, so you can also just copy one into `.claude/skills/` (or your agent's equivalent) by hand.

### Skills

26 skills. Install any of them with `npx skills add av/skills --skill <name>`.

#### Orchestration & autonomous work

| Skill | What it does |
| --- | --- |
| [workgraph](./workgraph) | Orchestrate work as a cyclic directed graph of subagent-executed nodes with transition criteria on edges, budgeted cycles, and per-node… |
| [workmachine](./workmachine) | Run work as an explicit event-driven state machine executed by subagents. |
| [timeboxed-iterating](./timeboxed-iterating) | Run a task iteratively over a user-specified duration by dispatching subagents. |
| [use-coding-agents](./use-coding-agents) | How to use the coding agents installed on this machine (claude, codex, droid, grok, hermes, opencode, copilot, pi) as plain sub-agents in… |
| [sandcastle](./sandcastle) | Orchestrate AI coding agents (Claude Code, Codex, OpenCode) in isolated sandboxes using the @ai-hero/sandcastle SDK. |
| [autoresearch](./autoresearch) | Runs autonomous keep/discard experiments on a codebase to optimize a single metric for a fixed duration, in the style of… |
| [ideate](./ideate) | Timeboxed ideation on a topic using propose-and-critique subagent pairs. |

#### Code quality & testing

| Skill | What it does |
| --- | --- |
| [anneal](./anneal) | Use when the user wants to systematically fix AI code slop — duplicated logic, over-engineering, silent error swallowing, convention… |
| [bugbash](./bugbash) | Systematically explore and test any software project (CLI, API, Backend, Library, etc.) to find bugs, usability issues, and edge cases. |
| [bughunt](./bughunt) | Fully autonomous bug hunting pipeline — discover bugs in a scoped area using parallel subagents, independently triage each finding, fix… |
| [agent-integration-testing](./agent-integration-testing) | Use when the user requests integration testing, feature validation, or test plan execution |

#### Writing & research

| Skill | What it does |
| --- | --- |
| [article-factory](./article-factory) | Produce a researched long-form article from a topic prompt via an orchestrated pipeline - research agent (first-person sources,… |
| [mosaic-writing](./mosaic-writing) | Assemble a finished piece from human-written fragments via an orchestrated two-loop pipeline - an assembly loop (assembler + cold… |
| [catalog-deslop](./catalog-deslop) | Catalog-then-fix slop removal on an existing prose draft. |
| [factual-communication](./factual-communication) | Restate content as a flat list of atomic facts in the style of av/facts fact sheets. |
| [timeframe-research](./timeframe-research) | Build a timeframe-bounded research dossier by decomposing a topic into year orchestrators and month-level research passes that each write… |
| [make-video](./make-video) | Build a HyperFrames video composition from a brief/script autonomously. |

#### Local LLMs

| Skill | What it does |
| --- | --- |
| [run-llms](./run-llms) | Set up and run local LLMs with Harbor. |
| [pull-llamacpp-model](./pull-llamacpp-model) | Use when pulling or downloading a new llamacpp model. |
| [boost-modules](./boost-modules) | Create custom modules for [Harbor Boost](https://github.com/av/harbor/tree/main/boost), an optimizing LLM proxy. |

#### Agent craft

| Skill | What it does |
| --- | --- |
| [discipline](./discipline) | Bulletproof agent operating protocol. |
| [improve-skill](./improve-skill) | Improve an existing agent SKILL.md through one gated cycle: select the target (default this skill), snapshot the committed baseline,… |
| [superclaude](./superclaude) | Configure and operate the Claude Code harness for large codebases. |

#### Frameworks & tools

| Skill | What it does |
| --- | --- |
| [preact-buildless-frontend](./preact-buildless-frontend) | Build-less ESM frontends that run directly in the browser without bundlers. |
| [tinygrad](./tinygrad) | Deep learning framework development with tinygrad - a minimal tensor library with autograd, JIT compilation, and multi-device support. |
| [turso-db](./turso-db) | Install, configure, and work with Turso DB — an in-process SQLite-compatible relational database engine written in Rust. |
