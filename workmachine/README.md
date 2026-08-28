# workmachine

Run work as an explicit event-driven state machine executed by subagents. The orchestrator is the runtime from the canonical loop — `state, effects = init(machine); execute(effects); while state is active: event = nextEvent(); state, effects = transition(machine, state, event); execute(effects); return state.output`. All routing judgment is authored ONCE, at plan time, into a machine file (states, event alphabet, transition table, budgets, final states); at runtime the orchestrator does pure table lookups and dispatches effects — it never decides, never authors, never ingests artifacts. Subagent/sync protocol is the timeboxed-iterating one: role prompts scaffolded once to disk and dispatched BY PATH, an initialiser preamble every subagent reads first, a self-populating cheatsheet, per-unit files, tiny structured returns, independent measurement gate. Use when the user says "workmachine", "run this as a state machine", "state-machine this", or when a goal has a small number of clearly named phases with explicit outcomes (built / passed / failed / blocked) and you want the routing to be auditable rather than judged on the fly. For clock-driven loops use timeboxed-iterating; for wide graphs with judged edge criteria use workgraph.

```bash
npx skills add av/skills --skill workmachine
```
