---
name: workgraph
description: Orchestrate work as a cyclic directed graph of subagent-executed nodes with transition criteria on edges, budgeted cycles, and per-node gates (runtime verification, metric, or artifact). Use when the user says "workgraph", "run this as a graph", "graph this work", or when a goal has parallel branches, feedback loops, or mixed gate types that a linear loop cannot express. For chain-shaped work use timeboxed-iterating, autoresearch, or dark-factory instead.
---

# Workgraph

Work expressed as a directed graph. Nodes are units of work executed by
subagents. Edges carry transition criteria. Cycles are allowed — and budgeted.

You are the **orchestrator**: router, scheduler, gatekeeper, scribe. All
productive work happens inside subagents. The sibling skills are degenerate
cases of this one — timeboxed-iterating is a single budgetless cycle on a
clock, autoresearch a metric-gated cycle, dark-factory a verified chain. When
the work is genuinely chain-shaped, use them; a graph run costs measurably
more tokens than a loop and earns it back only through width and recovery.

```
Plan ──► lint ──► ┌─► route ─► schedule ─► dispatch ─► gate ─► log ─┐
                  │                                                 │
                  └────────────── graph still live ─────────────────┘
                  └── exit signal ──► final summary
```

## Role and Iron Laws

```
1. YOU DO NO WORK. You route, schedule, dispatch, gate, and log. Nothing else.
2. THE GRAPH FILE IS GROUND TRUTH. Every state change lands in it, append-only.
3. EVERY CYCLE HAS A BUDGET. An unbudgeted loop is a structural defect.
4. NODES NEVER TALK TO EACH OTHER. Artifacts on edges, via the graph dir, only.
5. INTEGRATION IS SERIALIZED. One merge into the trunk at a time, gated.
```

Degrees of freedom are split on purpose:

- **Fixed protocol**: gating, evidence, logging, cycle budgets, merge
  serialization. Execute exactly as written.
- **Your judgment**: graph shape, parallel width at any moment, and when the
  run is over. The sections below give guidance, not rules. Own these
  decisions and log the reasoning for each one.

## The Graph Model

**Node** — one unit of work a single subagent can complete in one dispatch:
`id`, `charter` (one sentence), `gate`, `verification` (commands or criteria),
`heavy?` (consumes a compute slot), `status`, `visits`.

**Edge** — `from → to` plus a **criterion**: a natural-language condition
evaluated by you against the source node's result. Forward edges advance work;
backward edges express recovery, refinement, and retry. A criterion must be
decidable from artifacts on disk — never from optimism.

**Statuses** — `PENDING → READY → RUNNING → VERIFIED | FAILED`, plus
`ESCALATED`. Statuses are re-entrant: an incoming edge may send a `VERIFIED`
node back to `READY` (regression, new evidence, refinement). Each activation
is a **visit**, logged separately; history is never rewritten.

**Gate types** — assigned per node at plan time:

| Gate | Passes when | Lineage |
|---|---|---|
| `verify` | Software runs; evidence per command: CHECK/COMMAND/EXPECTED/ACTUAL/RESULT; zero regressions | dark-factory |
| `metric` | Extracted value strictly beats recorded best (you extract it from the raw log yourself) | autoresearch |
| `artifact` | Named artifact exists and is committed; `git log -1` and `git status` confirm | timeboxed-iterating |

**Cycles** — every cycle in the graph carries:
- a **budget**: max traversals before escalation (default 3),
- at least one **exit edge** whose criterion is satisfiable.

A cycle without both fails lint.

## Inputs

| Input | Required | Example |
|---|---|---|
| Goal | yes | "harden the importer", "optimize val_bpb", "build the TUI" |
| Repo(s) / scope | yes | `~/code/pace`, mutable and frozen paths |
| Compute slots | yes (default 1) | 1 — how many `heavy` nodes may run concurrently |
| Duration | optional | "overnight" = 8 hours; sets a deadline signal |
| Metric spec | if any `metric` nodes | name, direction, extraction command |
| Focus / constraints | optional | recorded verbatim, bounds node charters |

Ask once, up front, for anything missing. After planning, never ask again.

## The Graph Directory

`~/.harness/workgraph/<slug>/` — ground truth for the whole run:

```
graph.md      — nodes, edges, statuses, budgets (you alone write it)
log.md        — append-only visit log + your judgment calls with reasons
evidence/     — one file per visit: <node>-v<visit>.md, raw gate evidence
artifacts/    — node outputs passed along edges (reports, specs, diffs)
```

`graph.md` format:

```markdown
# Workgraph: <goal>
- Slug: <slug>  Started: <ts>  Deadline: <ts or none>  Compute slots: <n>

## Nodes
### <id> [<STATUS>] (visits: N/budget)
- Charter: <one sentence>
- Gate: verify | metric | artifact
- Verification: <commands / criteria>
- Heavy: yes | no

## Edges
- <from> → <to>: <criterion>
```

Pass subagents **paths, never contents**. They read the graph dir themselves.

## Phase 1: Plan

1. **Decompose.** Break the goal into nodes sized for one dispatch each: one
   sentence of charter, concrete verification, obvious gate type. Draw edges
   with explicit criteria, including the backward edges you already know you
   want (verify→build on FAIL, gate→ideate on discard streak).
2. **Lint the graph.** Hard failures, fix before anything runs:
   - disconnected nodes or unreachable subgraphs
   - a cycle without a budget or without a satisfiable exit edge
   - an edge criterion not decidable from on-disk artifacts
   - a node whose charter needs a paragraph (split it) or whose verification
     is trivial (merge it)
3. **Shape check.** If the linted graph is a single chain or a single simple
   cycle — stop and use the matching sibling skill instead. Say so to the
   user. Width and recovery are what justify the overhead.
4. **Write the graph directory.** Root nodes (no incoming forward edges) →
   `READY`. Record start time, deadline if any, compute slots.
5. **Baseline where a metric exists.** A `metric` subgraph needs a baseline
   node run and gated first — there is no best without it.

Planning is the only phase where user interaction is allowed.

## Phase 2: The Loop

### Route

After every node return, evaluate its out-edge criteria against the result
and its evidence file. For each satisfied criterion: target → `READY`,
increment its visit counter if re-entering. Budget exhausted → `ESCALATED`,
see Escalation. Log every routing decision and the criterion that fired.

### Schedule — guidance, your call

Pick which `READY` nodes to dispatch now. No fixed width — weigh:

- **Independence first.** Parallelize only nodes with no path between them
  and no overlapping write scope. When two nodes might touch the same files,
  serialize them — conflict cost exceeds parallel savings.
- **Isolation for mutators.** Repo-mutating nodes run in their own git
  worktree/branch. Read-only nodes (research, ideation, review) share the
  tree and are cheap width.
- **Compute slots cap `heavy` nodes.** A heavy node dispatches only when a
  slot is free. Cheap nodes may overlap a heavy run freely.
- **Modest width wins.** Coordination failures grow faster than linearly
  with concurrent mutators; beyond 3-4 the merge gate becomes the
  bottleneck. When in doubt, narrower.
- Log the width you chose and why whenever it changes.

### Dispatch

One prompt per node — fill the brackets, keep the structure:

```
You are executing ONE node of a work graph.

Charter: <node charter>
Scope: <worktree path or repo path; mutable and frozen paths>
Gate: your work will be gated by <gate type + verification commands>.
Run the verification yourself before returning, but do NOT gate yourself.

Read first: <graph dir>/graph.md and <specific artifacts/ inputs for this
node>. Do not repeat work recorded in log.md.

Rules:
- Stay inside your charter. One node, nothing else.
- Commit before returning; confirm with git status.
- Temp files to /tmp only.
- If blocked, report exactly what is blocking — do not improvise around it.

Return: what you did, commit hash, verification output location, and any new
work you believe this graph is missing (proposed nodes/edges, one line each).
```

No deadline awareness for subagents. Fresh subagent per visit — context
carries through the graph dir, not through the agent.

### Gate

Per the node's gate type, on evidence **you** check:

1. Spot-check reality: `git log -1`, `git status`, and re-run at least one
   verification command yourself. A report is not evidence; a hallucinated
   PASS is the failure mode that looks like success.
2. `verify` — every check has CHECK/COMMAND/EXPECTED/ACTUAL/RESULT and
   passed; any regression = FAIL regardless of the new capability.
3. `metric` — extract the value from the raw log yourself; strictly better
   than best = pass. Equal, worse, crash, or value absent from log = FAIL.
4. `artifact` — the artifact exists, is committed, is non-trivial.
5. Write the evidence file, set the status, route.

### Merge gate

Integration of worktree branches into the trunk is the one serialized section:

- One merge at a time, in the order branches gate-pass.
- After each merge, run the regression checks of every `VERIFIED` node whose
  scope overlaps the merged changes. Regression → the offending node's
  backward edge fires; nothing else merges until resolved.
- Clean merge: you may perform it mechanically. Conflict: dispatch an
  integrator subagent with both branches and the relevant charters, then
  re-gate the merged result. You never resolve conflicts by hand.

### Log

Append to `log.md` per visit: node, visit number, trigger edge, verdict,
one-line summary, evidence path. Append judgment calls (width changes, exit
reasoning, graph edits) as their own entries.

## Dynamic Expansion

Subagents propose missing nodes and edges in their returns; you decide.
Append accepted ones to `graph.md` — new nodes and edges only, never edits to
history — and re-lint anything that creates a cycle. Stall behavior follows:
a graph that goes quiet while the goal is unmet gets an **ideation node**
(read the whole graph dir, return 5-10 concrete new nodes) rather than an
early exit.

## Exit — guidance, your call

There is no single stop rule. Signals to weigh:

- **Quiescence** — nothing `RUNNING`, no criterion fires, no expansion worth
  adding. The natural end.
- **Deadline** — in duration mode the clock is the strongest signal; check
  `date +%s` against it before every scheduling round. Let in-flight nodes
  finish; dispatch nothing new past it.
- **Budget pressure** — escalations piling up, or global visits far beyond
  plan, mean the graph is wrong, not almost-done. Escalate rather than grind.
- **Goal saturation** — remaining `READY` nodes no longer serve the goal.
  Legitimate, but the bar is high: write the justification in `log.md`
  before acting on it.

The anti-exit discipline of the sibling skills still applies — every one of
these thoughts is a trap:

| Thought | Instead |
|---|---|
| "Good enough to show the user" | Criteria still fire and time remains → schedule. |
| "The graph has mostly converged" | Mostly ≠ quiescent. Route again. |
| "Remaining nodes are too hard" | Hard is what escalation is for, not exit. |
| "Let me just fix this bit myself" | No. That is a node. Dispatch it. |
| "One more visit won't matter" | Not your call unless a signal above says so — in the log. |

Exit without a logged reason is a protocol violation.

## Escalation

On cycle budget exhaustion, irreconcilable merge, or structural flaw:

1. Write `~/.harness/workgraph/<slug>/escalations/<node>.md`: what the node
   is for, every visit's approach and evidence, your root-cause assessment,
   options (redesign, split, drop, widen).
2. Mark the node `ESCALATED`; the rest of the graph keeps running unless it
   depends on the escalated node.
3. Surface all escalations in the final summary. Only halt the whole run and
   ask the user mid-run if the trunk itself is blocked.

## Final Summary

After exit, append to `log.md` and report: goal, exit signal and reasoning,
nodes verified / failed / escalated, visits total, what the work products are
and where, kept metric deltas if any, and proposed-but-not-run nodes worth a
future graph. Leave every branch and worktree in place — merging anything
further is the user's decision.

## Red Flags — STOP and Reread This Skill

- You are editing a file that is not inside `~/.harness/workgraph/<slug>/`
- Two mutating nodes are running with overlapping write scope
- A node passed its gate on evidence you did not check yourself
- A cycle is on visit 4 with a budget of 3
- Two branches are merging at once, or a merge skipped regression checks
- You are composing an exit summary with no logged exit reason
- A judgment call (width, exit, graph edit) happened and `log.md` doesn't say why
