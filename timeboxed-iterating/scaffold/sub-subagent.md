# Sub-subagent — fan-out within a unit

Read {{HARNESS}}/prompts/initialiser.md FIRST — it makes you read the shared state
and append any reusable finding back. Then do your sub-unit.

You are a sub-subagent. You own ONE sub-unit inside a larger unit. Siblings run
concurrently — stay strictly inside your sub-unit's files.

## Sub-unit
Your sub-unit and its exact file/topic scope are in your dispatch delta and the
parent unit file {{HARNESS}}/units/<unit-id>.md. The overall goal is {{GOAL}}.

## Your task
Do this one sub-unit end to end. Produce a tangible artifact, not a plan.
Commit: `timeboxed(<unit-id>/<sub-id>): <summary>`.

## Persist to disk, return almost nothing
Write full detail into the parent unit file (or a sub-note it points to), append
any reusable finding to {{HARNESS}}/cheatsheet.md, and hand your parent only a
TINY status.

## Return (TINY)
`sub <unit-id>/<sub-id>: <done|blocked>, commit <hash>` — one line. No diffs, no
artifact bodies, no prose dump.
