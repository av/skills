# Gumroad listing plan

Sell only these four products:
- `agent-integration-testing`
- `bugbash`
- `timeboxed-iterating`
- `ideate`

Do not create paid Gumroad listings for the other repo skills. They are lower-value as standalone products.

## Market research

### Existing agent-skill products found

- [Claude Code Skills Guide](https://markkashef.gumroad.com/l/claude-code-skills-guide)
  - Free CAD listing, 5.0 rating from 2 reviews.
  - Body emphasizes concrete deliverables: bad vs good examples, comparison guides, Excalidraw diagrams.
  - Trust angle: teaches why skills fail vs work; shows complete examples, not vague prompts.

- [AI Coding Agent Workflow Blueprints](https://popularaitools.gumroad.com/l/ai-coding-agent)
  - Strong pain-led copy: buyers waste Claude Max tokens and get half-working code.
  - Body uses numbered workflow blueprints, value anchors per blueprint, before/after examples, token-saving claims.
  - Trust angle: repeatable workflows used by developers shipping production software.

- [Claude Code: 34 AI Agents + Prompts + Connectors](https://growthwithalex.gumroad.com/l/claudeagents)
  - High-count bundle across departments.
  - Body lists every included agent and says each includes problem solved, architecture diagram, build brief, live run timeline, difficulty, estimated build time, weekly review prompt.
  - Trust angle: complete operating system, not a prompt pile.

- [350+ Claude Skills Vault](https://aiautobase.gumroad.com/l/claude-skills)
  - Large-volume vault positioned around productivity, marketing, automation, business workflows.
  - Body stresses categories, instant use, structured prompts, real-world execution.
  - Trust angle: breadth and ready-to-use organization.

- [Claude Skills for UI Polish](https://aidesignlab.gumroad.com/l/claude-skills-for-ui-polish)
  - $4.99 USD listing, 5.0 rating from 1 review.
  - Body is the best model for us: starts with a real failure mode, then shows guide + skill files, categories, exact rules, anti-patterns, before/after examples.
  - Trust angle: specific values, checklists, examples, and anti-patterns prove professional craft.

### Product-page customization research

- Gumroad supports per-product cover and thumbnail images. Use a real thumbnail; Gumroad help says product covers matter, and Gumroad help snippets say products with covers convert more than products without them.
- Use square thumbnails for listings/library/discover. Work from 1200x1200 or 2400x2400 source so it stays sharp.
- Use cover images/videos as the first trust surface. Safe default: 1280x720+ cover plus 600x600+ thumbnail.
- Gumroad product URLs are editable under the product description. Use clean slugs.
- Gumroad profile pages support custom font/colors, pages, sections, product sections, sorting, and product filters. Use one section called `Agent Skills` with only these four plus the bundle.
- The body is the main conversion surface. Existing products win by showing: specific pain, exact included artifacts, examples/anti-patterns, who it is for, and compatibility.

Sources:
- https://gumroad.com/help/article/60-adding-a-cover-image
- https://gumroad.com/help/article/124-your-gumroad-profile-page
- https://gumroad.com/help/article/81-custom-product-urls
- https://help.gumroad.com/article/104-styling-your-product

## Plan

1. Create one Gumroad product per selected skill, plus one bundle.
2. Price low-friction:
   - Individual: `$5`
   - Bundle: `$15` for all four
   - Optional launch price: `$9` bundle for the first week.
3. Package each product as a zip containing:
   - `README.md`
   - `SKILL.md`
   - any referenced assets, if present
4. Use a consistent page structure:
   - Pain-led opening
   - `What this gives your agent`
   - `What you get`
   - `Professional trust notes`
   - `Who this is for`
   - `Compatibility`
   - `Install`
5. Add the same trust block to every page, adjusted per skill:
   - `Plain-text skill, no lock-in.`
   - `Built from real agent workflow failures: unclear scope, missing repros, premature stopping, weak review loops.`
   - `Includes concrete operating rules, red flags, and output formats so the agent can execute instead of improvise.`
   - `Made by @av, a software engineer building local-LLM and agent infrastructure in public.`
6. Gumroad profile setup:
   - Create a profile section named `Agent Skills`.
   - Show only these four products and the bundle in that section.
   - Hide/deprioritize all lower-value skills from paid store navigation.

## Packaging commands

Run from repo root:

```bash
mkdir -p /tmp/skills-gumroad
for skill in agent-integration-testing bugbash timeboxed-iterating ideate; do
  rm -f "/tmp/skills-gumroad/$skill.zip"
  zip -r "/tmp/skills-gumroad/$skill.zip" "$skill/README.md" "$skill/SKILL.md"
done
rm -f /tmp/skills-gumroad/agent-skills-bundle.zip
zip -r /tmp/skills-gumroad/agent-skills-bundle.zip \
  agent-integration-testing/README.md agent-integration-testing/SKILL.md \
  bugbash/README.md bugbash/SKILL.md \
  timeboxed-iterating/README.md timeboxed-iterating/SKILL.md \
  ideate/README.md ideate/SKILL.md
```

## Shared page population instructions

For every individual product:

- Product type: Digital product
- Price: `$5`
- File: matching `/tmp/skills-gumroad/<skill>.zip`
- Thumbnail: square, dark background, huge title, one accent color, small line `Agent Skill by @av`
- Cover: 16:9, show the workflow in 3-4 steps, not abstract art only
- Custom URL: use the skill slug
- Tags: `claude code`, `ai agents`, `agent skills`, `coding agents`, plus product-specific tags
- Product body: copy the relevant body below
- CTA button text if editable: `Get the skill`

## Product 1: agent-integration-testing

### Gumroad fields

- Name: `Agent Integration Testing — Verifiable Test Specs for Coding Agents`
- URL: `agent-integration-testing`
- Short description: `Turn vague feature checks into agent-runnable integration tests with clear prerequisites, steps, and pass/fail evidence.`
- Tags: `claude code`, `ai agents`, `integration testing`, `test plans`, `qa automation`

### Product body

```markdown
Most coding agents can write tests. Fewer can reliably decide what to test, document prerequisites, run the checks, and prove the result.

This skill gives your agent a professional integration-testing workflow: inspect the codebase, write a verifiable test spec, execute tests through isolated subagents, collect evidence, and optionally route failures into implementation work.

## What this gives your agent

- A repeatable process for turning feature requests into integration test specs.
- A required prerequisites section so subagents do not fail from missing setup.
- Plain-English test cases with concrete reproduction steps.
- Verifiable expectations only: shell commands, HTTP responses, file outputs, database checks.
- A subagent execution model: one worker per test or suite, with pass/fail logs.
- Red flags for invalid tests like “looks good” or “animation feels smooth.”

## What you get

- `SKILL.md` — the full operating playbook.
- `README.md` — install command and short usage summary.
- Example auth integration spec showing prerequisites, steps, and expectations.

## Professional trust notes

This is not a prompt pack. It is an execution protocol for agents doing QA work in real repositories.

It is designed around the failure modes that make AI-generated tests useless: missing environment setup, unverifiable assertions, vague UI checks, and uncoordinated manual execution. The skill forces the agent to write tests another agent can actually run.

Built by @av, a software engineer building local-LLM and agent infrastructure in public. Plain-text format, no vendor lock-in.

## Who this is for

- Developers using Claude Code, OpenCode, Cursor, or similar coding agents.
- Teams that want agents to validate features before declaring them done.
- Solo builders who need test coverage without hand-holding every check.

## Compatibility

Works anywhere your agent can read files, run shell commands, spawn subagents, and edit markdown.

## Install

```bash
npx skills add av/skills --skill agent-integration-testing
```
```

### Cover/thumbnail instructions

- Thumbnail headline: `AGENT INTEGRATION TESTING`
- Accent color: electric blue.
- Cover diagram: `Investigate → Spec → Dispatch → Evidence → Fix`.
- Show one mini test card with `Prerequisites`, `Steps`, `Expectations`, `Pass/Fail`.

## Product 2: bugbash

### Gumroad fields

- Name: `Bugbash — Repro-First QA for AI Coding Agents`
- URL: `bugbash`
- Short description: `Make your agent explore software like a QA engineer and return reproducible bugs with commands, logs, tracebacks, and severity.`
- Tags: `claude code`, `ai agents`, `bug bash`, `qa`, `software testing`, `repro steps`

### Product body

```markdown
“Find bugs” is too vague for an agent. It will skim, poke a few happy paths, and hand you a weak report.

Bugbash gives your agent a structured QA workflow for CLIs, APIs, backends, libraries, and other software surfaces. It maps the surface area, tests realistic and adversarial paths, captures evidence, and writes a report a human can reproduce.

## What this gives your agent

- A five-step QA loop: initialize, orient, explore, document, wrap up.
- Surface-area mapping before testing begins.
- Test prompts for happy paths, invalid inputs, missing context, boundary conditions, permissions, and ports.
- Evidence rules: stdout, stderr, exit codes, HTTP status, tracebacks, logs.
- Reproduction-first issue format with severity, expected vs actual behavior, and exact commands.
- Report hygiene: update severity counts, stop background processes, summarize the real risk.

## What you get

- `SKILL.md` — the full bugbash workflow.
- `README.md` — install command and quick usage summary.
- A reusable report structure for `/tmp/dogfood-output/report.md`.

## Professional trust notes

This skill is built for useful bug reports, not vibes.

Every finding must include reproduction evidence. The agent is instructed to verify reproducibility, capture environment state, test like a real user, and treat confusing errors or wrong exit codes as valid product issues.

Built by @av, a software engineer building local-LLM and agent infrastructure in public. Plain-text format, no vendor lock-in.

## Who this is for

- Developers who want an AI agent to do serious exploratory QA.
- Maintainers of CLIs, APIs, libraries, and backend services.
- Builders who need actionable bug reports before shipping.

## Compatibility

Works with coding agents that can run commands, inspect source, start services, and write markdown reports.

## Install

```bash
npx skills add av/skills --skill bugbash
```
```

### Cover/thumbnail instructions

- Thumbnail headline: `BUGBASH`
- Accent color: red/orange.
- Cover diagram: `Surface area → Edge cases → Evidence → Repro report`.
- Show a fake issue card with `Severity`, `Repro`, `Expected`, `Actual`, `Evidence`.

## Product 3: timeboxed-iterating

### Gumroad fields

- Name: `Timeboxed Iterating — Keep Agents Working Until the Clock Runs Out`
- URL: `timeboxed-iterating`
- Short description: `Stop agents from quitting early. Run iterative subagent work for the full duration with progress logs and committed artifacts.`
- Tags: `claude code`, `ai agents`, `subagents`, `agent orchestration`, `automation`, `workflows`

### Product body

```markdown
Agents love to stop early. They summarize, ask for review, or decide the work is “good enough” long before the timebox is over.

Timeboxed Iterating fixes that. It turns the main agent into an orchestrator that checks the clock, dispatches one meaningful subagent iteration at a time, records progress, and keeps going until the deadline passes.

## What this gives your agent

- A strict orchestration loop governed by time, not vibes.
- A `/tmp` progress file that survives long runs and prevents repeated work.
- One-unit subagent dispatch prompts that produce committed artifacts.
- Stall recovery rules when work gets trivial or repetitive.
- Red flags that stop the orchestrator from doing worker tasks itself.
- A final summary format with iterations, commits, accomplishments, and remaining work.

## What you get

- `SKILL.md` — the full timeboxed orchestration protocol.
- `README.md` — install command and quick usage summary.
- Reusable subagent prompt template and progress-log format.

## Professional trust notes

This skill encodes the operational discipline missing from most agent workflows: use the whole time budget, keep context lean, delegate work units, write durable progress, and commit artifacts.

It is especially useful for long cleanup, test, refactor, documentation, or implementation pushes where an agent would otherwise stop after the first plausible result.

Built by @av, a software engineer building local-LLM and agent infrastructure in public. Plain-text format, no vendor lock-in.

## Who this is for

- Developers running multi-agent coding sessions.
- Builders who say “work on this for 2 hours” and expect the agent to actually use 2 hours.
- Anyone using subagents for iterative improvement.

## Compatibility

Works with agents that can check time, write files, dispatch subagents, and commit changes.

## Install

```bash
npx skills add av/skills --skill timeboxed-iterating
```
```

### Cover/thumbnail instructions

- Thumbnail headline: `TIMEBOXED ITERATING`
- Accent color: green.
- Cover diagram: `Clock → Dispatch → Commit → Log → Repeat`.
- Visual motif: timer plus loop arrows, not a generic calendar.

## Product 4: ideate

### Gumroad fields

- Name: `Ideate — Timeboxed Propose-and-Critique for AI Agents`
- URL: `ideate`
- Short description: `Run structured ideation with proposer/critic subagents, score every idea, and surface the strongest options after the timebox.`
- Tags: `claude code`, `ai agents`, `brainstorming`, `ideation`, `product ideas`, `subagents`

### Product body

```markdown
Most AI brainstorming produces a flat list of obvious ideas. No pressure test, no ranking, no memory of what was already rejected.

Ideate gives your agent a timeboxed propose-and-critique loop. Each iteration dispatches a proposer to generate one concrete idea, then a critic to score it honestly from the end-user perspective. The orchestrator tracks patterns and keeps going until the clock runs out.

## What this gives your agent

- A structured ideation loop controlled by time, not “enough ideas.”
- Separate proposer and critic roles so ideas get stress-tested before you see them.
- A progress file that records scores, weaknesses, frequency, and patterns.
- Steering rules that push the next proposal away from exhausted angles.
- Stall recovery when ideas get repetitive or low-quality.
- A final ranked shortlist with scores, critique points, and discovered patterns.

## What you get

- `SKILL.md` — the full propose-and-critique ideation protocol.
- `README.md` — install command and quick usage summary.
- Reusable proposer prompt, critic prompt, and final presentation format.

## Professional trust notes

This is not “give me 20 ideas.” It is a small evaluation system for agentic thinking.

The critic is required to ask whether the problem is real, whether simpler alternatives exist, how often it matters, what could go wrong, and whether the idea is truly high impact. That is what keeps the output useful.

Built by @av, a software engineer building local-LLM and agent infrastructure in public. Plain-text format, no vendor lock-in.

## Who this is for

- Product builders exploring features, names, workflows, or positioning.
- Developers deciding what to build next.
- Anyone who wants fewer generic AI ideas and more scored, defensible options.

## Compatibility

Works with agents that can check time, write files, and dispatch subagents.

## Install

```bash
npx skills add av/skills --skill ideate
```
```

### Cover/thumbnail instructions

- Thumbnail headline: `IDEATE`
- Accent color: violet.
- Cover diagram: `Proposer → Critic → Score → Patterns → Top ideas`.
- Show one scored idea card: `8/10`, `frequency: weekly`, `watch out for:`.

## Bundle page

### Gumroad fields

- Name: `Agent Workflow Skills Bundle — QA, Testing, Iteration, Ideation`
- URL: `agent-workflow-skills-bundle`
- Price: `$15`
- Short description: `Four practical agent skills for testing, bugbashing, long-running iteration, and scored ideation.`
- File: `/tmp/skills-gumroad/agent-skills-bundle.zip`
- Tags: `claude code`, `ai agents`, `agent skills`, `coding agents`, `subagents`, `qa`

### Bundle body

```markdown
Four practical agent skills for builders who want AI agents to do real work instead of improvising vague prompts.

This bundle covers the workflows that most coding agents still handle badly: writing verifiable integration tests, finding reproducible bugs, staying productive for a full timebox, and generating ideas that survive critique.

## What you get

- **Agent Integration Testing** — turn vague feature checks into runnable integration specs with prerequisites, steps, and pass/fail evidence.
- **Bugbash** — make agents explore CLIs, APIs, libraries, and backends like QA engineers, with reproducible bug reports.
- **Timeboxed Iterating** — keep agents dispatching useful work until the clock runs out, with progress logs and committed artifacts.
- **Ideate** — run proposer/critic ideation loops and receive ranked, scored ideas instead of generic brainstorming lists.

## Why this bundle exists

The hard part of using coding agents is not asking them to write code. It is making them operate with professional discipline: clear scope, reproducible evidence, time awareness, critique, progress logs, and useful final output.

These skills encode those workflows as plain-text operating playbooks.

## Professional trust notes

Built by @av, a software engineer building local-LLM and agent infrastructure in public.

Every skill is designed around real agent failure modes: unverifiable checks, vague bug reports, premature stopping, repeated ideas, missing setup, and weak final evidence.

Plain-text files. No subscription. No platform lock-in.

## Compatibility

Designed for Claude Code/OpenCode-style coding agents and adaptable to Cursor or any agent system that supports project instructions, shell tools, file edits, and subagents.

## Install individual skills

```bash
npx skills add av/skills --skill agent-integration-testing
npx skills add av/skills --skill bugbash
npx skills add av/skills --skill timeboxed-iterating
npx skills add av/skills --skill ideate
```
```

### Bundle cover/thumbnail instructions

- Thumbnail headline: `AGENT WORKFLOW SKILLS`
- Subtitle: `QA · Tests · Iteration · Ideas`
- Accent: four small colored blocks matching individual products.
- Cover: four cards in a 2x2 grid, one per skill, with the output each produces.
