---
name: ideate
description: Timeboxed ideation on a topic where lens-driven proposers generate structurally different ideas, blind critics cull them, and pairwise judges rank the survivors on a tournament ladder instead of 1-10 scores, evolving the leaders until the clock runs out. Use when the user wants to brainstorm, explore ideas, discover features, generate options, or think through possibilities for a specified duration. Triggers on requests like "brainstorm X for 30 minutes", "ideate on X", "spend an hour thinking about X", "what features should we build", "explore options for X". Not for executing a task over time (timeboxed-iterating) or optimizing a measurable metric (autoresearch).
---

# Ideate

Generate, cull, and rank ideas on any topic until the clock runs out. Proposers think through assigned lenses from a library of ideation frameworks, critics hunt for fatal flaws, and judges compare ideas two at a time. A ladder turns those comparisons into ratings. Leaders get evolved, unexplored lenses keep getting tried, and a playoff settles the final order.

Nobody in this skill gives an idea a score. Ask a model for 1–10 and nearly everything lands on 7 or 8. The ranking becomes noise, and the loop keeps polishing whatever it thought of first. "Which of these two is better?" has an answer even when both ideas are good, so every judgment here is head-to-head.

## Your role

You are the **orchestrator**. You:

1. **Manage the clock.** Run `date +%s` before every dispatch batch.
2. **Plan slots.** Decide each generation's lenses, parents, and idea IDs, and write them to the registry.
3. **Dispatch subagents.** Framer, proposers, critics, judges, meta-reviewer, using the prompts below.
4. **Read the ladder.** Run `ladder.py` and log what it says.

You do not propose, critique, judge, or summarize ideas yourself. You do not read idea cards during the loop; the ladder output and file names are enough to steer. All thinking happens in subagents, so your context lasts the whole run.

## The Iron Law

```
THE CLOCK DECIDES WHEN IDEATION ENDS. THE LADDER DECIDES WHAT WINS.
```

You do not stop early because the top ideas "look settled". You do not reorder the ranking because an idea "feels" better. Your opinion of an idea is not an input.

## Inputs

1. **Topic**: what to ideate on.
2. **Duration**: how long. Vague ("a while") means 1 hour. Ask once only if it is truly ambiguous.

Optional:

- **Top N**: how many ideas to present (default 3).
- **Context**: a codebase, documents, a domain, or constraints to ground ideas in.
- **Objective**: what "better" means. If the user does not give one, the framer infers it.

Requires `python3` and a harness that can dispatch subagents. Dispatch in parallel whenever the harness allows it. If it cannot run subagents in parallel, run 2 proposer slots per generation instead of 4 and dispatch sequentially.

## Run directory

`<SKILL>` is the absolute path of the directory containing this file. `<RUN>` is `/tmp/ideate-<topic-slug>-<epoch>`. Create it with `mkdir -p <RUN>/ideas <RUN>/critiques <RUN>/matches <RUN>/judgements`.

Write both paths out in full in every command and prompt. Shell variables do not survive between tool calls in most harnesses. `ladder <cmd>` below is short for `python3 <SKILL>/scripts/ladder.py <RUN> <cmd>`.

| Path | Written by | Content |
|---|---|---|
| `brief.md` | framer | objective, constraints, criteria, context digest, personas, random words |
| `registry.tsv` | you | one line per idea ID, written **before** dispatch: `id<TAB>gen<TAB>origin<TAB>lens<TAB>parents` |
| `ideas/<id>.md` | proposers | one idea card |
| `critiques/<id>.md` | critics | first line `verdict: KEEP`, `verdict: KILL <reason>`, or `verdict: DUPLICATE <id>` |
| `matches/<batch>.tsv` | judges | `a<TAB>b<TAB>winner`, where winner is `a`, `b`, or `tie` |
| `judgements/<batch>.md` | judges | one line of reasoning per pair |
| `patterns.md` | meta-reviewer | what wins, what loses, what is saturated, what is unexplored |
| `log.md` | you | one block per generation |

`origin` is `anchor`, `explore`, or `evolve`. `lens` is a lens ID from `references/lenses.md` (`-` for anchors). `parents` is comma-separated IDs (empty unless the origin is evolve). IDs are `I01`, `I02`, … in order of assignment.

`ladder.py` derives everything from these files: an idea is ranked once its card exists and its critique says KEEP.

| Command | Output |
|---|---|
| `ladder board [--top K] [--all]` | ranking: rating, wins-losses-ties, origin, lens, and how many anchors each idea is rated above. `?` marks a rating built on fewer than 4 judgments. `--all` adds killed and duplicate ideas with their reasons |
| `ladder pairs --n K` | the next K pairs to judge: new ideas meet the leader, the nearest anchor, and nearby ratings, and spare pairs refine the top 8 |
| `ladder pairs --final K` | a round robin among the top K |
| `ladder lenses --next K [--skip-top-families F] [--exclude ID…]` | the K least-used explore lenses, spread across families, optionally leaving out the F most-used families |
| `ladder lenses --evolve --next K` | the K least-used evolve operators |
| `ladder lenses --coverage` | idea count per lens family |
| `ladder stats` | ideas, kills, duplicates, and unique rate per generation |

Ratings come from a Bradley–Terry fit, an Elo-like model computed from all judgments at once, so the order of matches does not matter. 1500 is average. A 200-point gap means the higher idea wins about 3 head-to-heads in 4.

## Process

```
setup → gen 0: frame + anchors → critique → rank
      → loop { check clock → plan slots → propose → critique → rank → meta-review → log }
      → playoff (reserved time) → present
```

### 1. Setup

Record `start=$(date +%s)` and compute `deadline`. Reserve the last 10% of the duration, but at least 3 minutes, for the playoff: `playoff_at = deadline - reserve`. Create `<RUN>` and write the header of `log.md`: topic, start, deadline, playoff_at, top N.

### 2. Generation 0: frame and anchor

Register the anchors, one line each: `I01<TAB>0<TAB>anchor<TAB>-<TAB>` through `I06`. Dispatch the **framer**. It writes `brief.md` and six anchor cards: the ideas most people, or a model, would propose first.

Anchors are the bar, not strawmen. They compete on the ladder like every other idea. A non-anchor idea matters when it beats them. If an anchor finishes first, that is a real finding: the obvious answer held up.

Then dispatch one **critic** for all six anchors. Generation 1's proposers need only `brief.md` and the anchor cards, so plan generation 1 (step 3a) and dispatch its proposers alongside this critic. Rank the anchors with step 3d once the critic returns.

### 3. The generation loop

Repeat until `date +%s` ≥ `playoff_at`. Check the clock before every dispatch batch, not only at the top of the loop. If the time left before `playoff_at` is shorter than the last generation took, start the playoff now. A generation that cannot be ranked in time only adds noise to the playoff.

**a. Plan slots.** Use 4 slots per generation, each producing two ideas. Choose the slot mix with this table; the first matching row wins.

| Condition | Explore slots | Evolve slots |
|---|---|---|
| Generation 1 or 2 | 4 | 0 |
| **Lock-in**: the top 3 IDs are unchanged from two generations ago, an anchor has led for two straight generations, or one idea has led for three | 3, from `ladder lenses --next 3 --skip-top-families 2` | 1: `M5` (counter-idea) against the leader |
| Last generation's unique rate (`ladder stats`) is below 50% | 4, from `ladder lenses --next 4 --skip-top-families 3` | 0 |
| Otherwise | 2 | 2: one from `ladder lenses --evolve --next 1 --exclude M3 M5`, and one `M3` crossover |

- **Explore lenses** come from `ladder lenses --next <k>`.
- **Evolve parents** rotate through the current top 3, so every leader gets evolved. A crossover pairs the leader with the best-ranked idea from a different lens family; anchors count as a family of their own.
- Assign each slot two fresh IDs and append both registry lines before dispatching.
- Give each slot a persona number and, if its lens is `C2`, a random-word number. Rotate both through the lists in `brief.md`.

**b. Propose.** Dispatch one **proposer** per slot, in parallel when possible. Explore slots do not depend on rankings, so you may plan the next generation's explore slots and dispatch their proposers while this generation's judges are still running. Evolve slots wait for the ladder.

**c. Critique.** Dispatch one **critic** per slot. It reviews that slot's two cards. Never reuse a proposer as a critic.

**d. Rank.**

1. Run `ladder pairs --n <max(6, 2 × ideas ranked this generation)>`.
2. Split the pairs into batches of at most 6.
3. For each batch, dispatch **two judges**: one gets the pairs as listed and writes `matches/g<gen>-b<k>-fwd.tsv`; the other gets every pair reversed and writes `matches/g<gen>-b<k>-rev.tsv`. Position bias cancels. A split decision counts as one win each.
4. Check that each `.tsv` has one line per pair. Re-dispatch a judge that wrote nothing, once.

**e. Meta-review.** From generation 2 on, dispatch the **meta-reviewer**. It rewrites `patterns.md`, which proposers read.

**f. Log.** Append to `log.md`:

```markdown
### Gen <n> — <HH:MM>, <minutes> left before playoff
- Slots: <id pair> <lens> <explore|evolve parent>, …
- Top 3: <id rating name> × 3   (from `ladder board --top 3`)
- Stats: <this gen's row from `ladder stats`>
- Next: <the mix-table row that applies and why>
```

### 4. Playoff

When `date +%s` ≥ `playoff_at`, stop generating. Run `ladder pairs --final 6`; with N > 5, use N + 1 instead of 6. Dispatch the **final judges**: two per batch of up to 8 pairs, one forward and one reversed, writing `matches/final-b<k>-fwd.tsv` and `matches/final-b<k>-rev.tsv`. Use the final judge prompt, which debates each pair. Then run `ladder board --all` and `ladder lenses --coverage`.

The playoff is part of the timebox. If the deadline has already passed when the loop ends, run the playoff anyway; it is what makes the top of the ladder trustworthy.

### 5. Present

For each of the top N, read its card, its critique, and its lines in `judgements/` (`grep -h "<id>" <RUN>/judgements/*.md`). Present:

```markdown
## Top N ideas

### 1. <Name> — rating <r>, <W-L-T>, above <a>/<n> anchors
<the card's Idea and Example, condensed to 2–3 sentences>
**Why it won:** <the deciding differences judges cited>
**Strongest objection:** <from the critique, plus the suggested fix>
**Closest existing:** <from the critique>
**Lineage:** <lens> → <operator> (<parent id> → <id>)

…

---
**Best anchor:** <name> at rank <k>. <Which ideas beat the obvious answer. If an anchor ranks first, say plainly that the obvious idea held up.>
**Wildcard:** <the highest-ranked idea from a lens family not in the top N, one line>
**Patterns:** <2–3 sentences from patterns.md: what consistently won and lost>
**Run:** <ideas> ideas over <generations> generations · <killed> killed · <duplicates> duplicates · <judgments> head-to-head judgments · families explored <x>/8 · full record: <RUN>
```

Ratings are relative to this run only. Never translate them into a 1–10 score.

## Subagent prompts

Fill the angle brackets. Keep the rest verbatim. Pass file paths, not file contents.

### Card template

Every idea card, anchors included, uses this exact shape and stays under 180 words:

```markdown
# <name, at most 8 words>
**Problem:** <who has it, when, how often — 1–2 sentences>
**Idea:** <what it is and how it works — at most 3 sentences>
**Example:** <one concrete scenario>
**First step:** <what could be built or tested within a week>
**Bet:** <the assumption that must be true for this to matter>
```

A fixed card in a neutral tone keeps judges comparing ideas rather than prose. Length, confident wording, and salesmanship sway pairwise judges.

### Framer

```
You are framing an ideation run. Do not propose solutions beyond the anchors requested below.

Topic: <topic>
Context: <codebase paths, documents, constraints, objective — whatever the user gave>

Study the context until you understand the current state, the people involved, and the constraints.
Then write <RUN>/brief.md, under 450 words:
- **Objective:** one sentence: what "better" means and for whom. Judges decide by this.
- **Hard constraints:** what any idea must respect.
- **Criteria:** 3–4 in priority order, each with one line on what strong looks like.
- **Context digest:** facts a proposer needs (paths, current behaviour, users, numbers).
- **Personas:** 8 numbered ordinary people involved with the topic, one line each (role + situation). No famous people.
- **Random words:** 12 numbered concrete nouns unrelated to the topic.

Then write the anchors: the 6 ideas most people, or a model, would propose first.
Write each as a card in <RUN>/ideas/I01.md … I06.md, following this template exactly:
<card template>
Write them as well as you can. They are the bar every other idea must beat, not strawmen.

Return only: done
```

### Proposer

```
You are proposing ideas for: <topic>

Read first: <RUN>/brief.md. If <RUN>/patterns.md exists, read it: stay out of its Saturated
territory; its Wins section says what judges reward.
Ideas already on the board (do not repeat or reword any): run grep -h '^# ' <RUN>/ideas/*.md

Lens: read the entry "### <lens id> · …" in <SKILL>/references/lenses.md and follow its Do line.
<explore only> Persona: think as persona <k> from brief.md. <C2 only> Random word: number <w> from brief.md.
<evolve only> Parent(s): <RUN>/ideas/<pid>.md with its critique <RUN>/critiques/<pid>.md.
  Your ideas must beat the parent head-to-head, and each card must stand alone without referring to it.

1. Draft 6 candidates through the lens, one line each. Next to each, estimate the probability
   that a capable peer given only the topic would propose something equivalent.
2. Drop every candidate that matches a board idea. Push the rest to be bolder and more
   different from each other and from the board, while staying within the hard constraints.
3. Pick the 2 you would defend to a skeptical expert. At least one must have a probability
   below 0.2. When quality is close, prefer the lower probability.
4. Write each as a card, under 180 words, plain and neutral — no selling, no mention of the lens,
   persona, or probability — to <RUN>/ideas/<id1>.md and <RUN>/ideas/<id2>.md:
<card template>

Return only two lines: <id> <name>
```

### Critic

```
You are a skeptical reviewer. You did not write these ideas and owe them nothing.

Read <RUN>/brief.md. Then review each of: <RUN>/ideas/<id1>.md, <RUN>/ideas/<id2>.md

For each idea:
1. Duplicate check: list the board with grep -h '^# ' <RUN>/ideas/*.md and open any card that
   looks close. The same core mechanism for the same problem is a duplicate, however it is
   worded. The lower-numbered ID is the original.
2. Prior art: if you have web or code search, use it. First check whether the user's own
   product, codebase, or setup already does this; then look elsewhere. Name the closest
   existing thing and how the idea differs.
3. Steelman the idea in one sentence. Then find the single strongest reason it fails: the problem
   is invented or rare, a simpler alternative exists, a step cannot work, a constraint is
   broken, or second-order effects make it worse.
4. Verdict:
   - KILL <reason> only if it breaks a hard constraint in brief.md, already exists in the user's
     own context, does not address the topic, or cannot work as described (name the step).
   - DUPLICATE <original id> if it repeats an earlier card.
   - KEEP otherwise. Mediocre is KEEP: the ladder ranks weak ideas low. Do not kill for taste.

Write <RUN>/critiques/<id>.md for each idea:
verdict: KEEP | KILL <one-line reason> | DUPLICATE <id>
**Steelman:** …
**Strongest objection:** …
**Closest existing:** <thing — how this differs> | none found (searched: <what>) | not searched
**Fix:** the change that would most defuse the objection

Give no scores. Return only one line per idea: <id> <verdict>
```

### Judge

```
You are judging ideas head-to-head. You did not write any of them.

Read <RUN>/brief.md for the objective and criteria. For each pair below, read both cards
(<RUN>/ideas/<id>.md) and both critiques (<RUN>/critiques/<id>.md).

Decide which idea better serves the objective if only one could be pursued. Weigh the value
when it works, how often it matters, and how likely it is to work within the constraints.
Novelty counts only as far as it adds value over what already exists. Judge the idea, not the
writing: ignore length, confidence, and polish. Use tie only when you would toss a coin.

Pairs (first ID is A):
<id> <id>
…

For each pair, append one line to <RUN>/judgements/<batch>.md:
<A> vs <B> → <winner>: <the deciding difference, one sentence>
and one line to <RUN>/matches/<batch>.tsv (tab-separated):
<A>	<B>	<winner id or tie>

Return only: done <number of pairs>
```

### Final judge

The judge prompt with this paragraph inserted before "Pairs":

```
These are the finalists. For each pair, before deciding, write in your judgement line the
strongest case for A, the strongest case for B, and the decisive rebuttal. Then pick the winner.
```

### Meta-reviewer

```
You are reviewing an ideation run in progress. Do not propose ideas of your own.

Read <RUN>/brief.md, the output of: python3 <SKILL>/scripts/ladder.py <RUN> board --all
every file in <RUN>/critiques/, and every file in <RUN>/judgements/.

Overwrite <RUN>/patterns.md, under 250 words:
- **Wins:** traits that win head-to-head (cite IDs)
- **Loses:** traits that lose or get killed (cite IDs)
- **Saturated:** idea territories already well covered; proposers should leave them
- **Unexplored:** 3 specific territories nobody has tried that the objective could reward
- **Leader's weakness:** the strongest line of attack on the current #1

Return only: done
```

## Preventing premature exit

| Thought you are having | What you must do instead |
|---|---|
| "The top 3 are clearly the winners" | Ratings move. Keep generating until `playoff_at`. |
| "We have enough ideas" | Check the clock. Time left means keep going. |
| "The leader is obviously right" | Apply the lock-in row: counter-ideas and fresh families. |
| "These ideas are all similar now" | Check `ladder stats`. A falling unique rate means switching to unused families. |
| "I can judge this pair myself, it's faster" | Dispatch a judge. Your opinion is not an input. |
| "One more generation instead of the playoff" | The playoff starts at `playoff_at`. Unsettled ratings are worse than one fewer generation. |

## Failure handling

| Failure | Response |
|---|---|
| A proposer returns without writing a card | Leave the registry line. `board` counts it as awaiting. Do not re-dispatch the slot. |
| A critic misses a card | Re-dispatch a critic for that card once. An unreviewed card is never ranked. |
| A judge's `.tsv` has fewer lines than pairs | Re-dispatch that judge once with only the missing pairs, to a new file. |
| `ladder.py` errors | Fix the file it names (a malformed line in a `.tsv` or the registry), then rerun. Never rank by hand. |
| Every idea in a generation is killed | The lens or brief is mismatched. Log it and pick the next generation's lenses from different families. |

## Quick reference

| Item | Value |
|---|---|
| Run directory | `/tmp/ideate-<slug>-<epoch>/` |
| Ladder | `python3 <SKILL>/scripts/ladder.py <RUN> board\|pairs\|lenses\|stats` |
| Lens library | `references/lenses.md`: 55 explore lenses in 8 families, 7 evolve operators |
| Generation | 4 slots × 2 ideas → 4 critics → 2 judges per pair batch → meta-review → log |
| Anchors | 6 obvious ideas in generation 0, competing on the ladder |
| Scoring | none; blind pairwise judgments in both orders, Bradley–Terry ratings |
| Playoff | last 10% of the duration (at least 3 min): round robin of the top 6 with debate judging |
| Default top N | 3 |

## Red flags

- You wrote a 1–10 score, or asked a subagent for one.
- You read an idea card before the presentation step.
- A judge batch was dispatched in one order only.
- Two slots in one generation share a lens family when unused families remain.
- The last two generations had no explore slot.
- You skipped the meta-review, the log entry, or `date +%s` for a generation.
- You are presenting results before the playoff ran.

## Why this design

- **Pairwise, both orders.** LLM judges compress absolute scores toward the middle of the scale. Pairwise tournaments rank research ideas well enough to be useful (Si et al. 2024, [arXiv:2409.04109](https://arxiv.org/abs/2409.04109); Chain of Ideas, [arXiv:2410.13185](https://arxiv.org/abs/2410.13185), which also judges each pair in both orders).
- **Fixed cards.** Pairwise judges are more easily swayed by surface features than absolute ones (Tripathi et al. 2025, [arXiv:2504.14716](https://arxiv.org/abs/2504.14716)). A neutral card with a word cap takes those features away.
- **Tournament plus evolution.** Google's AI co-scientist ranks hypotheses with Elo tournaments, debates the top matches, evolves winners as new entrants rather than overwriting them, and feeds a meta-review back to generation ([arXiv:2502.18864](https://arxiv.org/abs/2502.18864)).
- **Lenses, personas, tail sampling.** Models converge on the same ideas (Artificial Hivemind, [arXiv:2510.22954](https://arxiv.org/abs/2510.22954)). Asking for candidates with probabilities and choosing low-probability ones restores diversity (Verbalized Sampling, [arXiv:2510.01171](https://arxiv.org/abs/2510.01171)), as do prompts that make the model push ideas apart (Meincke et al. 2024, [arXiv:2402.01727](https://arxiv.org/abs/2402.01727)). Framework prompts alone add little, so lenses are diversity cues here; the ladder decides quality.
