<img src="../assets/logos/workgraph.svg" width="72" align="left" hspace="12" alt="">

# workgraph

Orchestrate work as a cyclic directed graph of subagent-executed nodes with transition criteria on edges, budgeted cycles, and per-node gates (runtime verification, metric, or artifact). Use when the user says "workgraph", "run this as a graph", "graph this work", or when a goal has parallel branches, feedback loops, or mixed gate types that a linear loop cannot express. For chain-shaped work use timeboxed-iterating, autoresearch, or dark-factory instead.

```bash
npx skills add av/skills --skill workgraph
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
