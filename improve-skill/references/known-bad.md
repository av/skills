# Known-bad fixtures

The independent-gate judge compares the candidate `SKILL.md` to each fixture.
**Match** means the same shape, not byte identity and not the same `name:`.
Any match → `Verdict: FAIL`. Do not invent extra shapes. Do not skip a
fixture because the candidate added sentences.

## Fixture: stub-happy

```markdown
---
name: improve-skill
description: Improve agent skills.
---
# Improve Skill
Review the target skill and make it better. Be thorough. Consider clarity
and completeness. Commit your changes when you are happy with them.
```

Match if: frontmatter plus an intent paragraph; no ordered cycle (select /
baseline / diagnose / one-change / independent gate / commit-on-pass);
description has no WHEN; the author decides it is better ("when you are happy").

## Fixture: numbered-gate-free

```markdown
---
name: improve-skill
description: Improve a SKILL.md. Use when asked to improve a skill.
---
# Improve Skill
1. Read the skill.
2. Think about improvements.
3. Edit it.
4. Commit.
```

Match if: numbered steps with no off-tree baseline, no diagnosis lens, no
one-change limit, and no independent FAIL path; commit is the last step.

## Other shapes (no full fixture)

| Shape | Match if |
|---|---|
| triggerless | description has no WHEN and no quoted utterances |
| sibling-collision | load-steals duration work / code slop / graphs / metric loops without naming those siblings |
| placeholder | body is TODO or "write the procedure later" |
| ask-back | user must supply the diagnosis or the change |
