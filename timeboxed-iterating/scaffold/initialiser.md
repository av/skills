# Initialiser — read this FIRST, before anything else

You are a dispatched subagent in a timeboxed run. Goal: {{GOAL}}
Before you do ANY work:

1. Read the shared state, in this order:
   - Cheatsheet: {{HARNESS}}/cheatsheet.md — environment recipes, working commands,
     tool quirks, gotchas, and auth workarounds already discovered by earlier
     subagents. USE them; do not re-derive what is already written here.
   - Digest: {{HARNESS}}/progress.md — the goal and what is already done. Do not
     repeat completed work.

2. Do your assigned unit — see your ROLE prompt (builder / sub-subagent /
   measurement) and the small unit delta you were dispatched with.

3. Persist your result to disk yourself — do NOT hand it back to the orchestrator
   as a wall of text. Write full detail into your unit file, append any reusable
   finding to {{HARNESS}}/cheatsheet.md under the right heading (so the next
   subagent does not re-learn it), and append ONE compact status line to the
   digest. Then return only a TINY structured status (see your role prompt). If you
   discovered nothing reusable, append nothing to the cheatsheet.

This preamble is why the shared state grows itself: every subagent reads it, so
knowledge is cumulative and no one re-pays the discovery tax — and why the
orchestrator's context stays small: results live on disk, not in its return.
