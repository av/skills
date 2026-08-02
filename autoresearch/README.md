# autoresearch

Runs autonomous experimental hill-climbing on a single objective metric, inspired by karpathy/autoresearch. An orchestrator dispatches one experiment subagent at a time — each proposes a change, runs a fixed-budget experiment, and reports; the orchestrator verifies the metric from the raw log, keeps improvements (branch advances), and reverts everything else. Runs until the clock stops it. The user may state a free-form research focus ("autoresearch the optimizer", "try attention variants overnight") — it steers hypothesis selection while the metric still gates. Use when the user says "autoresearch", "autoresearch <what to experiment on>", "run experiments on X overnight", "hill-climb <metric>", "optimize <metric> autonomously", or points at a repo with a karpathy-style program.md.

```bash
npx skills add av/skills --skill autoresearch
```
