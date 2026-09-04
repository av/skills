# article-factory

Produce a researched long-form article from a topic prompt via an orchestrated pipeline - research agent (first-person sources, working-definition gate), narrative-architecture outline, writer/cold-reviewer loop with an explicit ACCEPT/REVISE verdict contract, then a catalog-deslop pass with a regression gate. The orchestrator dispatches subagents only; the writer never judges its own draft. Use when the user says "article factory", "write an article about X", "run the article pipeline", or asks for a researched long-form piece produced end-to-end. For essays and micro posts in the user's own voice without a research stage, use the prose skill instead.

```bash
npx skills add av/skills --skill article-factory
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
