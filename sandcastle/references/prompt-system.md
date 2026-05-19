# Prompt System Reference

## Prompt Modes

### Inline Prompts

Pass a string directly via `prompt`:

```typescript
await run({
  agent: claudeCode(),
  sandbox: docker(),
  prompt: "Refactor the auth module to use dependency injection",
});
```

Inline prompts are passed to the agent verbatim. No substitution, no shell expansion. Passing `promptArgs` with an inline prompt is a runtime error.

### Prompt Files

Pass a file path via `promptFile`:

```typescript
await run({
  agent: claudeCode(),
  sandbox: docker(),
  promptFile: "./.sandcastle/prompt.md",
  promptArgs: { ISSUE_TITLE: "Fix login bug" },
});
```

Prompt files support template arguments and shell expressions.

## Template Arguments

Use `{{KEY}}` placeholders in prompt files:

```markdown
# Task

Fix the following issue:

**Title:** {{ISSUE_TITLE}}
**Body:** {{ISSUE_BODY}}
**Priority:** {{PRIORITY}}
```

Arguments are provided via `promptArgs`:

```typescript
promptArgs: {
  ISSUE_TITLE: "Login page crashes on mobile",
  ISSUE_BODY: "When tapping the login button on iOS Safari...",
  PRIORITY: "high",
}
```

Values can be `string`, `number`, or `boolean`.

### Built-in Arguments

Two arguments are auto-injected and **cannot be overridden**:

| Argument | Value |
|---|---|
| `{{SOURCE_BRANCH}}` | The branch the agent is working on |
| `{{TARGET_BRANCH}}` | The branch to merge into (for branch strategies) |

Attempting to override these via `promptArgs` is a runtime error.

## Shell Expressions

Use `` !`command` `` in prompt files to run commands inside the sandbox before each iteration:

```markdown
# Current State

The test output is:
!`npm test 2>&1 | tail -50`

The current diff is:
!`git diff`

Files in src/:
!`find src -name "*.ts" | head -20`
```

Shell expressions:
- Run **inside the sandbox**, not on the host
- Run **per iteration**, so each iteration sees fresh state (e.g., updated test results)
- Have a 30-second timeout
- Are evaluated **after** template argument substitution

## Processing Order

```
1. Prompt file read from disk
2. {{KEY}} substitution (host-side, once)
3. !`command` expansion (sandbox-side, per iteration)
4. Final prompt sent to agent
```

## Interactive Mode

In `interactive()` mode, if prompt files contain `{{KEY}}` placeholders without matching `promptArgs`, the user is prompted interactively to provide values.

## Writing Good Prompts

### Structure

```markdown
# Role / Context

You are working on {{REPO_NAME}}. Your task is to {{TASK}}.

# Current State

!`git log --oneline -5`
!`npm test 2>&1 | tail -30`

# Instructions

1. Step one
2. Step two
3. Step three

# Constraints

- Do not modify files in src/core/
- All tests must pass before completing
- Follow the existing code style

# Completion

When finished, output <promise>COMPLETE</promise>.
```

### Completion Signal

For iteration loops, instruct the agent when to signal completion:

```markdown
When you have fixed all issues and all tests pass, output:
<promise>COMPLETE</promise>

If you cannot fix an issue, still output the completion signal and explain what blocked you.
```

The default signal is `<promise>COMPLETE</promise>`. Custom signals are set via `completionSignal`.

### Structured Output Tag

For structured output, include the XML tag in the prompt:

```markdown
Analyze the codebase and produce a plan. Output your plan as JSON inside a <plan> tag:

<plan>
{
  "issues": [
    { "title": "...", "priority": "high" }
  ]
}
</plan>
```

The tag name must match the `tag` in `Output.object({ tag: "plan", schema })` or `Output.string({ tag: "plan" })`. Sandcastle validates that the tag appears in the resolved prompt text at startup.

### Per-Iteration Prompts

Shell expressions make iteration loops powerful — each iteration sees updated state:

```markdown
# Iteration Context

Remaining lint errors:
!`npx eslint src/ --format compact 2>&1 | head -20`

Failing tests:
!`npm test 2>&1 | grep "FAIL" | head -10`

# Instructions

Fix the next batch of errors shown above. Focus on one file at a time.

When all errors are resolved (both sections above are empty), output:
<promise>COMPLETE</promise>
```
