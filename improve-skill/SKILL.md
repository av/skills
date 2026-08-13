---
name: improve-skill
description: Improve an existing agent SKILL.md through one gated cycle: select the target (default this skill), snapshot the committed baseline, diagnose against skill-design-principles plus four rubric dimensions, apply exactly one focused change, and ship only if a different agent than the author PASSes with quoted evidence. Use when the user says "improve this skill", "improve-skill", "iterate on SKILL.md", or "apply skill-design-principles to a skill". Do not use for code slop over a duration (anneal), generic timeboxed work (timeboxed-iterating), graph orchestration (workgraph), or metric hill-climb on a codebase (autoresearch).
---

# Improve Skill

One cycle, one change, one independent verdict. You do not decide the skill got better.

## Role

You are the **orchestrator**. You:

1. Resolve the target `SKILL.md`.
2. Snapshot the baseline off-tree before any edit.
3. Diagnose against the lens below and pick exactly one hole.
4. Apply that one change, or dispatch an author who does only that.
5. Dispatch a **different** agent as judge. Enforce the verdict.

You do **not**: score your own (or the author's) change; skip the gate; rewrite the skill; hand-edit generated README catalog files; create a skill from scratch.

```
NO INDEPENDENT PASS → NO COMMIT. FAIL → RESTORE BASELINE.
```

If you cannot dispatch a different agent, stop. Leave the tree at baseline. Do not self-score.

## Inputs

| Input | Required | Default |
|---|---|---|
| Target skill | no | The `SKILL.md` next to this file (`improve-skill`) |
| Commit prefix | no | none; the dimension still goes in the subject |

If the user names a path that is not an existing `*/SKILL.md`, stop and say so. Do not ask them what to change.

Out of scope: README, cheatsheet, harness files, new skills, application code, duration-boxed work.

## Working files

`$d` is created in step 2 (`/tmp/improve-skill-<target-basename>-<epoch>/`).

```
baseline/          # committed (or pre-edit) copy of the skill tree
diagnosis.md       # one hole, or "nothing above the bar"
gate.md            # judge verdict — written by the judge, not you
log.md             # append-only
```

Pass **paths**, not file contents, to the author and the judge.

## Process

```
select-target → baseline → diagnose → one-change → independent-gate
  PASS: regen catalog if needed, commit, record hash
  FAIL: restore baseline, do not commit, record why
  nothing-to-do: stop, no commit (valid refused improvement)
```

### 1. Select target

1. If the user gave an existing `…/SKILL.md` (or a skill directory that contains one), that is the target.
2. Otherwise the target is this skill: the `SKILL.md` in the same directory as the file you are reading.
3. Confirm the file exists and YAML `name:` equals the directory name. If not, stop.

### 2. Capture baseline

Do this **before** any edit. `skill_dir` is the absolute path to the directory that contains the target `SKILL.md`. Run from a shell:

```bash
skill_dir=<absolute path>
slug=$(basename "$skill_dir")
d=/tmp/improve-skill-$slug-$(date +%s)
mkdir -p "$d/baseline"
repo=$(git -C "$skill_dir" rev-parse --show-toplevel)
rel=$(python3 -c "import os; print(os.path.relpath('$skill_dir', '$repo'))")
if git -C "$repo" rev-parse --verify --quiet "HEAD:$rel" >/dev/null; then
  git -C "$repo" archive HEAD "$rel" | tar -x -C "$d/baseline" --strip-components=1
else
  cp "$skill_dir/SKILL.md" "$d/baseline/SKILL.md"
  if [ -d "$skill_dir/references" ]; then cp -R "$skill_dir/references" "$d/baseline/references"; fi
fi
git -C "$repo" rev-parse --short HEAD > "$d/baseline-rev.txt"
```

If `HEAD:$rel` exists, that tree is the baseline even when the working tree is dirty. Restore uses `$d/baseline/`.
If `$d/baseline/SKILL.md` is missing, stop. Do not edit. Do not invent a baseline.

### 3. Diagnose

Read the target `SKILL.md` and any `references/` one level under it. Write `$d/diagnosis.md`. Do not ask the user what is wrong.

**Lens** (apply all; pick one hole):

1. **Description = WHAT + WHEN.** Triggers named. Siblings that could steal load are excluded by name.
2. **Executable procedure.** A cold agent can name the next action and the stop/fail condition. Ordered steps, not principles.
3. **Degrees of freedom.** Fragile steps (baseline, one-change, independent gate, commit-on-pass) are locked. Wording of a change is free. "Use judgment" on a gated step is a hole.
4. **One home per fact; no sprawl.** No tutorial on what a skill is. No no-op restatement.
5. **Four rubric dimensions** (the judge scores these same four):
   - **Clarity** — every step names a next action or a stop condition.
   - **Trigger reliability** — intended utterances land here; sibling collisions do not.
   - **Procedure completeness** — no step the skill claims to require is missing or "figure it out".
   - **Anti-failure coverage** — each named failure mode has a named protection (restore, refuse, stop).

Write exactly one of:

```markdown
# Diagnosis
- Dimension or failure mode: <one name>
- Hole: "<quote from the current skill or ABSENT>"
- Change: <one sentence>
```

or

```markdown
# Diagnosis
nothing above the bar
```

If `nothing above the bar`, append that to `log.md` and **stop**. Do not edit. That is a valid cycle.

### 4. One focused change

Edit only the hole named in `diagnosis.md`. One dimension or one failure mode. Not a rewrite. Not "also cleaned up X".

- You may edit `SKILL.md` yourself or dispatch an author with the target path, the diagnosis path, and "change only this hole".
- Do not edit generated `README.md` files.
- After the edit, if `$repo/scripts/generate.ts` exists, run from `$repo`:

```bash
deno run --allow-read --allow-write scripts/generate.ts
```

Never hand-patch the root `### Skills` list.

If the author touches anything outside the named hole, revert those extras before gating.

### 5. Independent gate

Dispatch a **new** agent. Not you. Not the author. Give it only the baseline path, the live candidate path, and this section.

Judge prompt (fill the brackets, keep the rest):

```
You are an independent skill judge. You did not author this change.
Baseline: < $d/baseline/SKILL.md >
Candidate: < live SKILL.md path >
Also read sibling files in each tree if present.

Do not improve the candidate. Do not take the author's word.

1. Mechanical validity — FAIL if any miss:
   - candidate exists; directory name == YAML name
   - YAML name: and description: are single-line (not `>` / `|`)
   - description is 1–1024 chars, no XML tags, states WHAT and WHEN
   - a generate.ts-style first-line parse would capture the real description text
2. Score each dimension BETTER / SAME / WORSE. Quote both versions
   (or "absent in baseline") for every cell.
   - Clarity: next action or stop condition newly named vs buried or vaguer
   - Trigger reliability: intended utterance newly caught, or sibling newly
     excluded vs lost trigger or new collision
   - Procedure completeness: a required step newly specified vs removed or
     weakened to judgment
   - Anti-failure coverage: a named failure mode newly protected vs a
     protection removed
3. Known-bad — FAIL if the candidate matches: stub with no steps; manifesto
   with no sequence; triggerless description; author told to self-score;
   improve then commit with no independent FAIL path; placeholder/TODO body;
   user must supply the diagnosis or the change.

Write < $d/gate.md > as:
- validity: PASS or FAIL + first miss
- four cells with quotes
- known-bad: match/no-match per shape
- Verdict: PASS or FAIL

PASS only if validity holds AND at least one BETTER AND zero WORSE AND no
known-bad match. 0 BETTER (rephrase, length-only, synonym churn) is FAIL.
Length is not a dimension. "Looks better" without quotes is FAIL.
```

You do not write `gate.md`. If the judge returns without a `Verdict:` line, treat as FAIL.

### 6. Commit only on PASS

Read `$d/gate.md`.

**PASS**

```bash
git -C "$repo" add <skill-dir>
if [ -f "$repo/scripts/generate.ts" ]; then git -C "$repo" add README.md; fi
git -C "$repo" commit -m "<prefix>improve-skill: <dimension> — <one line>"
```

`<dimension>` is the name from `diagnosis.md`. `<prefix>` is the caller's required prefix plus a trailing space, or empty. Add only the skill directory and generated README files.

Record the hash in `log.md`.

**FAIL**

```bash
cp "$d/baseline/SKILL.md" <skill-dir>/SKILL.md
if [ -d "$d/baseline/references" ]; then rm -rf <skill-dir>/references; cp -R "$d/baseline/references" <skill-dir>/references; fi
if [ -f "$repo/scripts/generate.ts" ]; then
  (cd "$repo" && deno run --allow-read --allow-write scripts/generate.ts)
fi
```

Do not commit. Record the judge's first failing clause in `log.md`.

You are not the judge. Do not override FAIL because the diff looks fine.

## Failure modes

| Failure mode | Protection |
|---|---|
| Author declares the new version better | Judge is a different agent; self-score is not a verdict |
| No subagent available | Stop at baseline; do not self-score |
| Kitchen-sink rewrite | Diagnosis names one hole; extras revert before the gate |
| Edit with no snapshot | Step 2 runs before any write; stop if `$d/baseline/SKILL.md` is missing; restore path is `$d/baseline/` |
| Commit then maybe measure | Step 6 reads `gate.md` first; FAIL does not `git commit` |
| Catalog description becomes `>` | Single-line `description:` required; generate.ts after description edits |
| Hand-edited README catalog | generate.ts only; never patch `### Skills` by hand |
| Ask the user what to fix | Default target; lens produces the hole or a refusal |
| Improve a non-skill | Step 1 stops unless the path is an existing `SKILL.md` |
| Sibling collision (duration work, code slop, graphs, metric loops) | Description excludes anneal, timeboxed-iterating, workgraph, autoresearch |

## Red flags — stop and reread

- You are about to commit without a `Verdict: PASS` written by someone else.
- You scored the change yourself.
- `diagnosis.md` lists more than one hole and you are fixing them all.
- You asked the user what to change.
- You are hand-editing a README.
- The working tree still has the candidate after a FAIL.
- You skipped baseline because it is a small edit.
- `$d/baseline/SKILL.md` is missing and you are about to edit.
