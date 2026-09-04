# mosaic-writing

Assemble a finished piece from human-written fragments via an orchestrated two-loop pipeline - an assembly loop (assembler + cold reviewer) that sequences the fragments into a draft, then a polish loop (polisher + cold reviewer), then frequency analysis and a catalog-deslop pass with a regression gate. Two modes with opposite fidelity contracts - stitch mode preserves the author's exact wording, narrative mode preserves every idea but may rewrite freely. Use when the user says "mosaic", "assemble my fragments", "stitch these notes into a post", or provides a fragments file to turn into a finished piece. For writing from a topic with research, use article-factory; for prose from scratch, use the prose skill.

```bash
npx skills add av/skills --skill mosaic-writing
```

Part of [av/skills](https://github.com/av/skills) — a library of agent skills for Claude Code, Codex, OpenCode and other coding agents.
