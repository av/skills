# API Types Reference

Complete type signatures for the sandcastle public API.

## RunOptions

```typescript
interface RunOptions<T = undefined> {
  agent: AgentProvider;
  sandbox: SandboxProvider;
  cwd?: string;                        // host repo dir (default: process.cwd())
  prompt?: string;                     // inline prompt (mutually exclusive with promptFile)
  promptFile?: string;                 // path to prompt file
  maxIterations?: number;              // default: 1
  hooks?: SandboxHooks;
  promptArgs?: PromptArgs;             // {{KEY}} placeholder substitution
  logging?: LoggingOption;             // "file" (default) or "stdout"
  completionSignal?: string | string[];// default: "<promise>COMPLETE</promise>"
  idleTimeoutSeconds?: number;         // default: 600 (10 min)
  name?: string;                       // run name prefix (appears in logs/branches)
  copyToWorktree?: string[];           // paths to copy into worktree
  branchStrategy?: BranchStrategy;
  resumeSession?: string;              // resume a prior Claude Code session
  signal?: AbortSignal;                // cancellation
  timeouts?: Timeouts;                 // override lifecycle step timeouts
  output?: OutputDefinition<T>;        // structured output config
}
```

## RunResult

```typescript
interface RunResult<T = undefined> {
  iterations: IterationResult[];
  completionSignal?: string;           // matched signal, or undefined
  stdout: string;                      // combined agent output
  commits: { sha: string }[];
  branch: string;
  logFilePath?: string;
  preservedWorktreePath?: string;      // set when worktree had uncommitted changes
  output?: T;                          // present when Output config provided
}
```

## IterationResult

```typescript
interface IterationResult {
  stdout: string;
  exitCode: number;
  iteration: number;
  commits: { sha: string }[];
}
```

## BranchStrategy

```typescript
type BranchStrategy =
  | { type: "head" }
  | { type: "merge-to-head" }
  | { type: "branch"; branch: string; baseBranch?: string };
```

## SandboxHooks

```typescript
interface SandboxHooks {
  host?: {
    onWorktreeReady?: Array<{ command: string; timeoutMs?: number }>;
    onSandboxReady?: Array<{ command: string; timeoutMs?: number }>;
  };
  sandbox?: {
    onSandboxReady?: Array<{ command: string; sudo?: boolean; timeoutMs?: number }>;
  };
}
```

## PromptArgs

```typescript
type PromptArgs = Record<string, string | number | boolean>;
```

Built-in args (auto-injected, not overridable): `SOURCE_BRANCH`, `TARGET_BRANCH`.

## LoggingOption

```typescript
type LoggingOption =
  | { type: "file"; path: string; onAgentStreamEvent?: (event: AgentStreamEvent) => void }
  | { type: "stdout" };
```

## AgentStreamEvent

```typescript
type AgentStreamEvent =
  | { type: "text"; message: string; iteration: number; timestamp: Date }
  | { type: "toolCall"; name: string; formattedArgs: string; iteration: number; timestamp: Date };
```

## Timeouts

```typescript
interface Timeouts {
  copyToWorktreeMs?: number;  // default: 60_000
}
```

## Output Definitions

```typescript
// Object output — validates against a Standard Schema (Zod, Valibot, etc.)
Output.object({
  tag: string,                         // XML tag name the agent wraps output in
  schema: StandardSchema,              // Zod schema, Valibot schema, etc.
})

// String output — extracts raw string content from XML tag
Output.string({
  tag: string,
})
```

`StructuredOutputError` is thrown on missing tag, invalid JSON, or schema validation failure. It preserves the run's commits, branch, and worktree path so callers can recover.

## CreateSandboxOptions

```typescript
interface CreateSandboxOptions {
  branch: string;
  sandbox: SandboxProvider;            // bind-mount or isolated (not noSandbox)
  cwd?: string;
  copyToWorktree?: string[];
  hooks?: SandboxHooks;
  logging?: LoggingOption;
  timeouts?: Timeouts;
  signal?: AbortSignal;
}
```

## Sandbox Handle

```typescript
interface Sandbox {
  run(options: SandboxRunOptions): Promise<RunResult>;
  interactive(options: SandboxInteractiveOptions): Promise<void>;
  close(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}
```

## CreateWorktreeOptions

```typescript
interface CreateWorktreeOptions {
  branchStrategy: BranchStrategy;
  cwd?: string;
  copyToWorktree?: string[];
  logging?: LoggingOption;
  timeouts?: Timeouts;
  signal?: AbortSignal;
}
```

## Worktree Handle

```typescript
interface Worktree {
  run(options: WorktreeRunOptions): Promise<RunResult>;
  interactive(options: WorktreeInteractiveOptions): Promise<void>;
  createSandbox(options: WorktreeSandboxOptions): Promise<Sandbox>;
  close(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}
```

## Docker Options

```typescript
interface DockerOptions {
  imageName?: string;
  containerUid?: number;               // default: host UID or 1000
  containerGid?: number;               // default: host GID or 1000
  selinuxLabel?: "z" | "Z" | false;
  mounts?: readonly MountConfig[];
  env?: Record<string, string>;
  network?: string | readonly string[];
}
```

## MountConfig

```typescript
interface MountConfig {
  hostPath: string;                    // supports ~, relative, absolute
  sandboxPath: string;                 // supports ~, relative (from worktree), absolute
  readonly?: boolean;
}
```

## Agent Provider Options

### claudeCode

```typescript
claudeCode(model?: string, options?: {
  effort?: "low" | "medium" | "high";
  captureSession?: boolean;            // default: true
  env?: Record<string, string>;
})
```

Default model: `"claude-opus-4-7"`.

### codex

```typescript
codex(model?: string, options?: {
  reasoningEffort?: string;
})
```

### opencode / pi

```typescript
opencode(model?: string, options?: {})
pi(model?: string, options?: {})
```

## Error Types

| Error | Cause |
|---|---|
| `CwdError` | Invalid `cwd` path |
| `StructuredOutputError` | Missing XML tag, invalid JSON, or schema validation failure |
| `AgentIdleTimeoutError` | Agent produced no output for `idleTimeoutSeconds` |
| `ExecError` | Command execution failure inside sandbox |
| `ExecHostError` | Command execution failure on host |
| `DockerError` | Docker-specific failure |
| `PodmanError` | Podman-specific failure |
| `WorktreeError` | Git worktree creation/cleanup failure |
| `PromptError` | Prompt file not found or invalid |
| `HookTimeoutError` | Hook command exceeded its timeout |
| `SyncError` | File sync failure (isolated providers) |
| `CopyError` | File copy failure |
| `MergeToHostTimeoutError` | Merge back to host branch timed out |
| `SessionCaptureError` | Failed to capture Claude Code session |

## Custom Sandbox Providers

```typescript
import { createBindMountSandboxProvider, createIsolatedSandboxProvider } from "@ai-hero/sandcastle";

const myProvider = createBindMountSandboxProvider({
  // ... provider configuration
});

const myIsolatedProvider = createIsolatedSandboxProvider({
  // ... provider configuration
});
```

## Session Management

```typescript
import {
  hostSessionStore,
  sandboxSessionStore,
  transferSession,
} from "@ai-hero/sandcastle";

const hostStore = hostSessionStore(hostRepoDir);
const sandboxStore = sandboxSessionStore(sandboxRepoDir, handle);
await transferSession(hostStore, sandboxStore, sessionId);
```
