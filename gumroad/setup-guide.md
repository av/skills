# Gumroad Setup Guide

## Account Access
You have a Gumroad account via Google Sign-in. Log in at [gumroad.com](https://gumroad.com) with your Google account.

## Product Setup Order

### 1. Create the Bundle First ($10)
- **Type:** Digital product
- **Name:** Agentic Skills Collection — 10 Production-Grade Skills for AI Coding Agents
- **Price:** $10
- **Description:** Copy from `bundle-description.md`
- **File:** Zip the entire `~/code/skills/` directory (excluding `.git/` and `gumroad/`)
- **Thumbnail:** Use the existing `assets/splash.png` or create a new one
- **Tags:** `ai agents`, `claude code`, `cursor`, `skills`, `llm`, `coding agents`, `opencode`

### 2. Create Individual Products ($3 each)
Create 10 individual products using the descriptions in `products/`:

| # | Product File | Gumroad Name |
|---|-------------|--------------|
| 1 | `products/run-llms.md` | Run Local LLMs — The Complete Agent Skill |
| 2 | `products/bugbash.md` | BugBash — Systematic Bug Hunting Skill |
| 3 | `products/agent-integration-testing.md` | Agent Integration Testing Skill |
| 4 | `products/ideate.md` | Ideate — Timeboxed Agent Brainstorming Skill |
| 5 | `products/timeboxed-iterating.md` | Timeboxed Iterating — Sustained Autonomous Work |
| 6 | `products/boost-modules.md` | Boost Modules — LLM Proxy Middleware Skill |
| 7 | `products/preact-buildless-frontend.md` | Buildless Frontend — Zero-Config Preact Skill |
| 8 | `products/turso-db.md` | Turso DB — Embedded Database Skill |
| 9 | `products/tinygrad.md` | Tinygrad — Deep Learning Framework Skill |
| 10 | `products/pull-llamacpp-model.md` | Pull LlamaCPP Model — ROCm Fix Skill |

For each:
- **Type:** Digital product
- **Price:** $3
- **Description:** Copy from the corresponding file in `products/`
- **File:** Zip the individual skill folder (SKILL.md + README.md + assets/)
- **Tags:** Use relevant tags per skill

### 3. Bundle Configuration
After creating individual products, Gumroad lets you create a bundle:
- Select all 10 individual products
- Set bundle price to $10
- This gives buyers all 10 files at a discount

## Marketing Copy

### Twitter/X Launch Thread (draft)

```
I packaged 10 production-tested agentic skills into a Gumroad store.

These aren't prompts. They're operational playbooks that turn any AI coding agent into a senior engineer.

What's inside:
- 🐛 BugBash — systematic bug hunting with repro evidence
- 🧪 Integration testing via subagents
- 💡 Ideation with proposer-critic pairs
- ⏱️ Timeboxed autonomous work (2+ hours without quitting)
- 🏗️ LLM proxy middleware
- ⚛️ Buildless frontends
- 🗄️ Embedded database mastery
- 🧮 Deep learning framework guide
- 🔧 Local LLM infrastructure
- 📦 ROCm image fix

$3 each. $10 for all 10.

[link]
```

### Product Page Hero Copy

**"Your agent's skill library."**

Drop these SKILL.md files into any project. Your AI agent reads them and immediately operates at senior engineer level. No more re-explaining context every session.

### Key Selling Points (for copy)
1. **Not prompts — playbooks.** Decision trees, pitfalls, verification checklists.
2. **Universal compatibility.** Works with Claude Code, OpenCode, Cursor, Cline, Windsurf, Aider.
3. **Zero dependencies.** Plain markdown. No lock-in.
4. **Battle-tested.** Built by a developer who runs these agents daily.
5. **One-time purchase.** No subscription. Updates included.

## File Packaging

Create zip files for Gumroad uploads:

```bash
# Bundle zip (all skills)
cd ~/code/skills
zip -r /tmp/agentic-skills-bundle.zip . -x ".git/*" "gumroad/*"

# Individual skill zips
for skill in agent-integration-testing boost-modules bugbash ideate preact-buildless-frontend pull-llamacpp-model run-llms timeboxed-iterating tinygrad turso-db; do
  zip -r "/tmp/skill-${skill}.zip" "$skill/"
done
```

## Thumbnail Ideas

For the main bundle:
- Dark background, monospace font
- "10 SKILLS" in large text
- Icons representing each skill (bug, brain, clock, database, etc.)
- Clean, developer-aesthetic

For individual skills:
- Consistent template with skill icon + name
- Same color scheme across all 10
- Recognizable at small sizes (Gumroad thumbnails are small)

## Post-Launch

- [ ] Tweet the launch thread
- [ ] Post to r/LocalLLaMA, r/ClaudeAI, r/cursor
- [ ] Share in Harbor Discord
- [ ] Add Gumroad link to GitHub profile
- [ ] Add link to av/skills README
