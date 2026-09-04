<img src="../assets/logos/timeboxed-iterating.svg" width="72" align="left" hspace="12" alt="">

# timeboxed-iterating

Run a task iteratively over a user-specified duration by dispatching subagents. The orchestrator stays strictly linear and time-checked, but each iteration fans out MULTIPLE subagents in parallel over independent units (and those subagents may fan out further). Shared state — a compact progress digest and a growing environment cheatsheet — lives on disk and is passed to every subagent BY REFERENCE, killing the per-subagent rediscovery tax. Every subagent first reads an initialiser preamble that points it at that shared state and makes it write findings back, so the cheatsheet populates itself; role prompts are produced ONCE on the filesystem by a single scaffold command and dispatched by path, never re-typed per dispatch. Subagents persist their results to disk and return only a tiny status, so the orchestrator's context stays small and lasts. The orchestrator classifies the goal as FINITE or OPEN-ENDED: finite lists may finish early; open-ended goals use the full duration, never idle, never manufacture busywork. Use when the user gives a task and a duration and wants it ground out iteratively by subagents over that time.

```bash
npx skills add av/skills --skill timeboxed-iterating
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
