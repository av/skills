<img src="../assets/logos/improve-skill.svg" width="72" align="left" hspace="12" alt="">

# improve-skill

Improve an existing agent SKILL.md through one gated cycle: select the target (default this skill), snapshot the committed baseline, diagnose against skill-design-principles plus four rubric dimensions, apply exactly one focused change, and ship only if a different agent than the author PASSes with quoted evidence. Use when the user says "improve this skill", "improve-skill", "iterate on SKILL.md", or "apply skill-design-principles to a skill". Do not use for code slop over a duration (anneal), generic timeboxed work (timeboxed-iterating), graph orchestration (workgraph), metric hill-climb on a codebase (autoresearch), or stripping slop from existing prose (catalog-deslop).

```bash
npx skills add av/skills --skill improve-skill
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
