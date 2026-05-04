# Pull LlamaCPP Model — ROCm Fix Skill

## Gumroad Title
Pull LlamaCPP Model — ROCm Fix Skill

## Price
$3

## Short Description
The AMD Strix Halo model pull workaround.

## Full Description

**If you're running llamacpp with a custom ROCm image (AMD Strix Halo / gfx1151), model pulls fail in the ephemeral container. This skill has the 3-step workaround: switch image, pull, restore. Without it, your GPU won't work on the next startup.**

### Who this is for
AMD Strix Halo users running Harbor with custom ROCm images. A small but growing community with a very specific, very annoying problem.

### What your agent learns
- 3-step process: switch to CPU image → pull model → restore custom image
- Mandatory restore step (GPU won't work without it)
- Extra args stored separately and unaffected by the switch
- Verification commands for model and image restoration

### Compatibility
Works with any AI agent that reads markdown files: Claude Code, OpenCode, Cursor, Cline, Windsurf, Aider, and more.

### Format
SKILL.md — plain markdown, no dependencies, no lock-in. Drop into your project and your agent picks it up immediately.

---

*The fix that took hours to figure out, explained in minutes*

*Part of the [Agentic Skills Collection](https://gumroad.com/l/agentic-skills-bundle) by [@av](https://github.com/av). Get all 10 skills for $10.*
