---
name: use-coding-agents
description: >
  How to use the coding agents installed on this machine (claude, codex, droid,
  grok, vktr, hermes, opencode, copilot, pi) as plain sub-agents in orchestrated
  workflows: one headless invocation, one prompt in, one result out. Deliberately
  ignores each CLI's own orchestration features (droid --mission, codex
  multi_agent, hermes delegation/moa/kanban, grok --agents, opencode personas).
  The orchestrator is whatever session is running the skill; the CLIs are
  interchangeable workers. Use when the user asks "which agent should run this",
  "fan out workers", "run X headless", or when a lifeos skill (overnight,
  timeboxed-iterating, workgraph, gauntlet, bughunt, dark-factory) needs to launch
  an agent CLI, or when a worker needs company context it should ask Viktor for
  (vktr).
---

# Use Coding Agents — Installed CLIs as Plain Sub-agents

Validated on `fedora` 2026-09-04 by running each command on a minimal prompt (write one file, or
reply OK). `pop-os` is set up identically via `control/install.sh`. Run `hostname` first.
Re-run `<agent> --help` before relying on any flag not listed here.

## Principle

Every agent here is a **worker**: it receives a prompt, edits files in one directory, commits,
prints a result, exits. Nothing more.

- **Do not use the CLIs' own orchestration features.** No `droid --mission`, no codex
  `multi_agent`, no hermes `delegate_task` / `moa` / `kanban`, no `grok --agents`, no opencode
  personas. Those are unvalidated here, spend tokens invisibly, and hide state from the orchestrator.
- **The orchestrator is the session running this skill** (normally claude via the Agent tool or a
  lifeos skill). It plans units, writes prompts, launches workers, reads short results.
- Workers are interchangeable. Pick by availability and cost, not by feature.

## Workers

| Agent    | Invocation                                                | Auto-approve                                   | Status 2026-09-04 |
|----------|-----------------------------------------------------------|------------------------------------------------|-------------------|
| claude   | `claude -p "<prompt>"`                                    | `--dangerously-skip-permissions`               | PASS |
| codex    | `codex exec "<prompt>"` (or prompt on stdin)              | `--dangerously-bypass-approvals-and-sandbox`   | PASS |
| droid    | `droid exec "<prompt>"`                                   | `--skip-permissions-unsafe` (not with `--auto`) | PASS |
| grok     | `grok -p "<prompt>"`                                      | `--always-approve`                             | PASS |
| vktr     | `vktr -p "<prompt>"` (Viktor as the model, see below)    | `--always-approve` (pair with `--deny`)        | verified 2026-10-09: keyed on all 10 fleet boxes, live OK |
| grokc    | `COLORTERM=truecolor grokc -p "<prompt>"`                 | built in (podman, `$PWD` only)                 | PASS |
| opencode | `opencode run "<prompt>"`                                | `--auto` (without it a permission prompt hangs a headless run) | PASS (default model now `openrouter/~anthropic/claude-sonnet-latest`, github-copilot disabled in `control/config/opencode.jsonc`) |
| pi       | `pi -p "<prompt>"`                                        | none needed                                    | PASS, local model, slow |
| hermes   | `hermes -z "<prompt>" --in <dir>`                         | `--yolo`                                       | FLAKY: `write_file` fails (`DaemonThreadPoolExecutor ... _initializer`); 1262 commits behind |
| copilot  | `copilot -p "<prompt>" -s`                                | `--allow-all`                                  | FAIL: no auth; needs interactive `/login` |

Facts from `--help`: grok 1.0.13 has no `--check` / `--best-of-n`; droid rejects `--auto` together
with `--skip-permissions-unsafe`; hermes restores the previous session's cwd unless `--in` is given.

### Getting the result back

| Agent    | Machine-readable result                              |
|----------|------------------------------------------------------|
| claude   | `--output-format json` (with `-p`)                    |
| codex    | `-o <file>` writes the last message; `--json` for JSONL events |
| droid    | `-o json`                                            |
| grok     | `--output-format json`, or `--json-schema '<schema>'` |
| vktr     | `--json` (`text`, `sessionId`), or `--json-schema '<schema>'` |
| opencode | `--format json`                                      |
| pi       | `--mode json`                                        |

Simplest contract, works everywhere: tell the worker to write its output to a file and print one
line `DONE|BLOCKED|FAILED <reason>`. Read the file, not the transcript.

### Cheaper / capped variants (validated)

Use when a unit is small. Same worker, fewer tokens:

- claude: `--model haiku --max-turns N` (do not add `--bare` or `--setting-sources ""`; both drop auth)
- codex: `-c model_reasoning_effort=low` (`minimal` is rejected)
- droid: `-r low -m claude-haiku-4-5-20251001`
- grok: `--max-turns N --no-subagents --disable-web-search`
- vktr: `--max-turns N` (lean toolset and one request per prompt are already the default)
- opencode: `--variant minimal`
- pi: `--thinking off`

### Listing and picking models

Validated 2026-09-04. Pass the id with the agent's model flag (`--model` / `-m`).

| Agent    | List available models                                   | Default today                 | Flag |
|----------|---------------------------------------------------------|-------------------------------|------|
| claude   | no list command; aliases `fable`, `opus`, `sonnet`, `haiku` or a full id like `claude-fable-5-1` | account default | `--model` |
| codex    | `codex debug models` (JSON catalog, 9 entries: gpt-5.6-sol/terra/luna, gpt-5.5, gpt-5.4, gpt-5.4-mini, gpt-5.3-codex-spark, …) | `gpt-5.6-sol` (`~/.codex/config.toml`) | `-m` |
| droid    | no list command; `/model` in the TUI. Custom/local models are the `customModels` entries in `~/.factory/settings.json` (ollama qwen3, glm-4.7-flash, kimi-k2.7-code, …) | `gpt-5.6-sol` | `-m` |
| grok     | `grok models` (7 entries, grok-4.6 default, grok-4.5, …) | `grok-4.6`                    | `-m` |
| opencode | `opencode models` (379 entries as `provider/model`; `openrouter/~anthropic/...` ids need the tilde) | `openrouter/~anthropic/claude-sonnet-latest` (`control/config/opencode.jsonc`) | `-m` |
| pi       | `pi --list-models [search]` (table with context/max-out/thinking columns) | `harbor-llamacpp` Qwen3-Coder-Next Q8 (`~/.pi/agent/settings.json`) | `--model` |
| hermes   | `hermes model` (interactive picker; `--refresh` re-fetches each provider's `/v1/models`); `hermes config get model` prints the default | `deepseek/deepseek-v4-flash-0731` via `nous` | `-m` |
| copilot  | no list command; `/model` in the TUI                    | account default               | `--model` |

### Viktor (vktr): the worker that knows the company

[`vktr`](https://github.com/viktor-com/vktr) is a Grok Build fork whose only model is `viktor`,
the company's AI employee. It runs as the key owner's own Viktor, so it can see what that person's
Viktor sees: Slack, Linear, GitHub, Notion, analytics, its skills. Same worker contract as `grok`.

- **Ask Viktor for context the repo can't give.** Who owns X, what a Slack thread decided, a Linear
  issue, a customer's state, logs or metrics. Ask instead of guessing:
  `vktr -p "<question>" --json` → read `.text`. Without grants it is read-only.
- **As a worker:** `vktr -p "<prompt>" -w <name> --always-approve --deny 'Bash(git push*)'`.
  Long prompts: `--prompt-file f`. Resume: `-r <sessionId>` or `-c`. Headless skips an untrusted
  repo's `AGENTS.md` silently; look at it, then pass `--trust` once.
- **Another CLI on Viktor:** `vktr launch --viktor claude -p "..."` (also codex, opencode, pi).
- **Install:** `curl -fsSL https://raw.githubusercontent.com/viktor-com/vktr/main/install.sh | sh`
  (no root; `~/.vktr/bin`, linked from `~/.local/bin`).
- **Key:** a personal Viktor API key with scope `chat:completions`. Only its owner can create it,
  at app.viktor.com/settings/api-keys. Save it with `vktr login`, which prompts with hidden input,
  or set `VIKTOR_API_KEY`. Never put a key on a command line, in a repo or in a prompt.
  `vktr doctor` shows where the key comes from and checks it live.
- No key → the worker prints `BLOCKED no Viktor key: run vktr login`. Never search for one.
- Every call spends Viktor workspace credits. Use it for context and Viktor-shaped tasks, not
  as a bulk code editor.

### Isolation

Two workers must never write the same file in the same tree. Use a worktree per worker:
`claude -w <name>`, `droid -w <name>`, `grok -w <name>`, `hermes --worktree`; for codex, opencode,
copilot, pi run `git worktree add` first and `cd` into it. (Worktree flags checked in `--help` only.)

### Resume instead of restart

`claude --resume <id>`, `codex exec resume --last`, `droid exec -s <id>`, `grok -r <id>`,
`hermes --resume <s>`, `opencode run -s <id>`, `copilot --continue`, `pi -c`. Resume a BLOCKED
worker with the missing fact rather than re-dispatching cold.

## Fan-out pattern

```bash
d=$(mktemp -d /tmp/orch-<slug>-XXXX)
cat > "$d/preamble.md" <<'P'
You are working on <project> at <code_path>.
Read CLAUDE.md / AGENTS.md / README.md first if present.
Commit with clear messages when done. Do not ask questions.
Do not start or reinstall opencode.service; the OpenCode daemon is retired.
Write your result to <unit_file> and print ONLY one line: DONE|BLOCKED|FAILED <reason>.
Before DONE, compare your diff and the observed result with the unit's Acceptance. If only a
proxy passed (tests, a build, a plan) or a gate is still open, print BLOCKED and name what is unmet.
After a tool error, do the next step it names before calling that tool again (table in
~/.agents/skills/use-coding-agents/SKILL.md, "Error → next step"). Never resend the same failing call.
P
cat > "$d/unit-1.md" <<'U'
Task: <what to do>
Acceptance:
- Deliver: <artifact or path>
- Scope: may change <paths>; must not touch <paths>
- Proof: <command or observation in the target environment>, not a proxy
- Gates: <checks and approvals to wait for; stop at a withheld one>
- Report: <format>
U
cd <code_path>
mkdir -p $d/cache-{1..5}   # one writable cache per worker; a shared /tmp cache breaks gh
XDG_CACHE_HOME=$d/cache-1 claude -p "$(cat $d/preamble.md $d/unit-1.md)" --dangerously-skip-permissions > $d/1.log 2>&1 &
XDG_CACHE_HOME=$d/cache-2 codex exec --dangerously-bypass-approvals-and-sandbox < <(cat $d/preamble.md $d/unit-2.md) > $d/2.log 2>&1 &
XDG_CACHE_HOME=$d/cache-3 droid exec --skip-permissions-unsafe -f <(cat $d/preamble.md $d/unit-3.md) > $d/3.log 2>&1 &
XDG_CACHE_HOME=$d/cache-4 grok -p "$(cat $d/preamble.md $d/unit-4.md)" --always-approve -w unit-4 > $d/4.log 2>&1 &
XDG_CACHE_HOME=$d/cache-5 opencode run "$(cat $d/preamble.md $d/unit-5.md)" --auto > $d/5.log 2>&1 &
wait; tail -n1 $d/*.log
```

Prompts live on disk and are dispatched by path. The orchestrator authors nothing itself
(same discipline as `timeboxed-iterating`).

### Acceptance contract

Every unit prompt carries the `Acceptance:` block above, filled in. A unit without it is not
ready to dispatch. Read a DONE against the same block, not against the worker's summary.
When the user corrects a result, rewrite the unit's `Acceptance:` from the correction before
resuming or re-dispatching; the worker's first line restates what changed and what will prove it.

### Error → next step

Repeat calls after an error that already said why were the main avoidable cost in long runs.

| Error | Next step, before calling the tool again |
|---|---|
| Claude `Edit`: file has not been read | `Read` that exact path (a shell `cat` does not count), then `Edit` |
| `Edit`: old string not found | re-read that region, copy the exact text |
| Claude Bash rejects `sleep N; <status>` | `Monitor` with an `until` loop, or `run_in_background` |
| droid Bash times out at 60 s | keep every wait under 60 s; poll in steps |
| `command not found` (e.g. `dstask`) | `command -v <tool>` once; absent → switch tools (Backlog.md for tasks) |
| `gh`: cache permission denied | `export XDG_CACHE_HOME=$(mktemp -d /tmp/cache-XXXX)`, retry once |
| guessed path does not exist | one `rg --files \| rg <name>`, then use what it finds |
| skill path does not exist | skills live at `~/.agents/skills/<name>/SKILL.md`; `ls ~/.agents/skills` once |

## Rules

- **Plain workers only.** If you reach for a CLI's mission / delegation / persona feature, stop and
  fan out from the orchestrator instead.
- **One unit, one directory, one commit** per worker. Merge worktrees afterwards.
- **Logs under `/tmp` or the scratchpad**, never in the repo.
- **Cap loops** with `--max-turns` where it exists, otherwise a turn budget in the prompt.
- **Bypass flags only** in a worktree, in `grokc`, or in a repo you can `git reset`.
- **Backlog.md stays human.** Workers do not touch `backlog/tasks/`.
- **Smoke tests are one word.** Validate a recipe with "Reply with the single word OK." only.
- **Shared machines: your home only.** On a multi-user box or fleet, act only inside your own
  user's home. Never read or change another user's sessions, worktrees, agent configs or keys.
  Fleet-wide installs are an admin task, not a worker task.
- **Do not invent flags.** Not in this file → run `--help` and paste the real one.

## Related skills

- `overnight` — dispatch approved work items to these workers in the background
- `timeboxed-iterating`, `workgraph`, `workmachine`, `gauntlet`, `dark-factory`, `bughunt` — orchestration loops that use these workers
