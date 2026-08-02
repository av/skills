---
name: autoresearch
description: Runs autonomous keep/discard experiments on a codebase to optimize a single metric for a fixed duration, in the style of karpathy/autoresearch. Use when the user says "autoresearch" (optionally with a focus, e.g. "autoresearch the optimizer"), asks to run experiments on a repo overnight, to hill-climb or optimize a metric autonomously, or points at a repo with a karpathy-style program.md.
---

# Autoresearch

Metric-gated experimental research on a codebase for a fixed duration.
Subagents propose and run experiments. The metric decides what survives.
The clock decides when to stop. You decide neither.

```
Setup ──► clock check ──► dispatch ONE experiment ──► verify ──► gate ──► log ──┐
              ▲                                                                 │
              └──────────────────── time remains ───────────────────────────────┘
              └── deadline passed ──► final summary
```

## Role and Iron Laws

You are the **orchestrator**: manage the clock, dispatch subagents, verify
results, gate outcomes, keep the ledger. All experimental work — designing
changes, editing code, running training/benchmarks — happens inside subagents.

```
1. THE CLOCK DECIDES WHEN TO STOP. NOT YOU.
2. THE METRIC DECIDES WHAT SURVIVES. NOT YOU.
3. ONE EXPERIMENT IN FLIGHT AT A TIME. NEVER PARALLEL.
```

Law 3 deliberately deviates from the parallel-subagent pattern of sibling
skills: experiments mutate shared state (one working tree, one branch, one
compute resource). Parallel dispatch corrupts the protocol.

Degrees of freedom are split on purpose:
- **Hypothesis selection is free.** Subagents choose what to try; you and they
  may be ambitious, radical, creative — anything inside the focus and scope.
- **The protocol is fixed.** Verify, gate, and log exactly as written below.
  No judgment calls except the simplicity criterion.

## Inputs

| Input | Required | Example |
|---|---|---|
| Target repo | yes | `~/code/autoresearch` |
| Metric + direction + extraction | yes | `val_bpb`, lower is better, `grep "^val_bpb:" run.log` |
| Experiment command | yes | `uv run train.py > run.log 2>&1` |
| Time budget per run | yes | 5 minutes wall clock |
| Mutable scope | yes | `train.py` only |
| Frozen scope | recommended | `prepare.py`, evaluation code, dependencies |
| Duration | yes | "overnight" = 8 hours |
| Research focus | optional | "attention variants", "the optimizer only" |
| Run tag | auto | date-based, e.g. `aug2` |

**Research focus** — a free-form directive from the user's prompt: a component,
an idea family, a constraint, or a hunch. It bounds hypothesis selection in
every dispatch; it never changes the gate. Record it verbatim in the ledger.

**Native mode** — if the target repo contains a karpathy-style `program.md`,
read it first and adopt its mechanics (metric, commands, scopes, budgets,
logging) verbatim. A user-stated focus still overrides its open-ended charter
for choosing hypotheses.

If required inputs are missing and no `program.md` supplies them, ask the user
once, up front, for everything at once. After setup, never ask again.

## Setup

Track this checklist:

```
- [ ] 1. Clock: date +%s, compute deadline ("overnight" = 8h)
- [ ] 2. Branch: git checkout -b autoresearch/<tag> from the default branch
- [ ] 3. Ledger created
- [ ] 4. Baseline run recorded as best
```

1. **Clock.** Record start timestamp and deadline.
2. **Branch.** Must be fresh — if `autoresearch/<tag>` exists or the tree is
   dirty, stop and tell the user.
3. **Ledger.** Two files, both in `/tmp` — never inside the target repo, so
   no reset, clean, or subagent commit can ever touch the record:
   - `/tmp/autoresearch-<tag>-<timestamp>.tsv`: header row, tab-separated:
     `commit	<metric>	cost	status	description`
     — status is `keep`, `discard`, or `crash`; cost is memory/VRAM/latency if
     the harness reports one, else `0`.
   - Progress file at `/tmp/autoresearch-<tag>-<timestamp>.md`: goal, focus
     (verbatim), metric spec, commands, scopes, start, deadline, current best
     (value + commit), and an `## Experiments` section.
4. **Baseline.** Dispatch a subagent to run the experiment command
   **unmodified** and report the metric. Verify it from the log yourself.
   Record it as row 1 of the ledger TSV (`keep`, `baseline`) and as best in the
   progress file. If the baseline crashes: fix-dispatch up to 3 times, then
   escalate — there is no run without a baseline.

Setup is the only phase where user interaction is allowed. Afterward the loop
runs lights-out until the deadline.

## The Experiment Loop

Before **every** dispatch: `date +%s` vs deadline. Passed → Final Summary.

### 1. Dispatch

One subagent. Strict template — fill the brackets, keep the structure:

```
You are running ONE experiment in an autonomous research loop.

Repo: <path>, branch autoresearch/<tag>, currently at the best-known commit.
Mutable scope: <files>. Frozen scope: <files> — read, never modify.
Metric: <name>, <lower|higher> is better. Current best: <value>.
Research focus: <verbatim focus, or "none: full mutable scope is fair game">.
Every hypothesis you consider must stay inside the focus.

Read <progress file path> and <ledger tsv path> FIRST. They list every
experiment already tried. Do NOT repeat any of them, including failures —
a discard is information, not an invitation.

Your task:
1. Pick ONE untried hypothesis likely to improve the metric. Prefer queued
   "suggested next" ideas from the ledger if any remain.
2. Implement it in the mutable scope. Minimal, focused diff.
3. git commit with a message stating the hypothesis.
4. Run: <experiment command with output redirected to run.log>. Never let
   run output into your context — redirect, then grep.
5. Extract the result: <extraction command>. Empty output = crash: read
   `tail -n 50 run.log`. Trivial cause (typo, missing import) — fix,
   commit, re-run once. Fundamentally broken idea — stop and report.
6. If the run exceeds <2x budget>, kill it and treat as a crash.

Return exactly:
- Hypothesis (one line)
- Commit hash
- Metric value (or CRASH + last error lines)
- Cost (memory/VRAM/latency if reported)
- One suggested next experiment based on what you observed

Do NOT decide keep-vs-discard, reset or advance the branch, or write to
the ledger files. The orchestrator gates.
```

Pass ledger **paths**, never contents. No deadline awareness for subagents.

### 2. Verify

Feedback loop: never gate on the report alone.

1. Run the extraction command on `run.log` yourself. The value must exist in
   the raw log and match the report. Reported number absent from the log =
   hallucination → treat as crash.
2. `git log --oneline -1` — the reported commit exists on the branch.
3. `git status` — clean apart from `run.log`.
4. `git diff <best commit>..<reported commit> --stat` — every touched file
   is inside the mutable scope. A frozen-scope edit is metric gaming, not a
   result: discard regardless of the reported value, and log it as such.

### 3. Gate

- **Strictly better than best** → keep: branch stays, update best in the
  progress file.
- **Equal, worse, or crash** → discard: `git reset --hard <best commit>`.
  Crashes log status `crash`, metric `0`.
- **Simplicity criterion** — the one judgment call you own: a change that
  removes code at equal-or-marginally-different metric is a keep; a marginal
  gain bought with disproportionate complexity is a discard. In doubt, the
  metric wins.

### 4. Log

Append one row to the ledger TSV and one entry to the progress file:

```markdown
### Experiment N — <time>
- Hypothesis: <one line>
- Commit: <hash>
- Metric: <value> (best: <value>)
- Verdict: keep | discard | crash
- Suggested next: <from the subagent>
```

Return to the clock check.

## Stall Recovery

When subagents repeat themselves, propose trivia, or report "no ideas left":

1. **Dispatch an ideation subagent**: read the full ledger and both scopes,
   return 5-10 concrete untried hypotheses inside the focus — including
   combinations of near-misses and radical structural changes. Append as a
   queue in the progress file; feed to subsequent dispatches.
2. **Escalate ambition.** Early experiments tweak knobs; later ones change
   structure. The ledger shows which rung you are on.
3. **Widen an exhausted focus.** If ideation returns nothing viable twice in a
   row, widen to the full mutable scope and log the widening loudly.
4. **Rewind sparingly.** Resetting best to an earlier commit to escape a local
   optimum is allowed but should be very rare. Log it loudly.

Running out of ideas is never a reason to stop.

## Preventing Premature Exit

Every one of these thoughts is a trap:

| Thought | Instead |
|---|---|
| "The metric has plateaued" | Not your call. Dispatch ideation. |
| "10 discards in a row — converged" | Discards are data. Change rung, dispatch. |
| "Good enough to show the user" | Only after the deadline. Check the clock. |
| "Remaining ideas are too radical" | Radical is the correct next rung. Dispatch. |
| "One more run won't matter" | ~12 runs/hour. It matters. Dispatch. |
| "Let me inspect the training output" | No. Grep the metric line. Nothing else. |
| "I should ask whether to continue" | The user is asleep. That is the point. |

Any variation of "maybe stop" → check the clock and dispatch again.

## Final Summary

Only after the deadline (let the in-flight experiment finish — never kill it
for the deadline):

1. Confirm the branch sits at the best commit (`git log --oneline`).
2. Append to the progress file and report:

```markdown
## Summary
- Experiments: N total — K keeps, D discards, C crashes
- Baseline: <value> → Best: <value> (<delta>)
- Branch: autoresearch/<tag> at <best commit>
- Kept changes: <one line each>
- Nearest misses worth a future run: <bullets>
- Ledger: <ledger tsv path>, <progress file path>
```

Leave the branch checked out at the best commit. Never merge to the default
branch — that is the user's morning decision.

## Red Flags — STOP and Reread This Skill

- You are editing a file in the target repo
- Two experiment subagents are running at once
- You gated on a metric value you did not extract from the log yourself
- A keep happened without the value beating the recorded best
- A keep happened without you checking the diff stayed in mutable scope
- `git status` showed a dirty tree and you dispatched anyway
- You are composing a message to the user before the deadline
- You have not run `date +%s` since the last subagent returned
