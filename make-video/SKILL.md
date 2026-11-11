---
name: make-video
description: >
  Build a HyperFrames video composition from a brief/script autonomously.
  Uses separated builder and critic subagents — builders never review their own
  work. Quality decisions are grounded in project context (identity, audience,
  goals) and established visual/motion design principles. Measurable criteria
  (text size, contrast, overflow) are verified with tooling, not visual judgment.
  Use when the user says "make this video", "implement this brief", "build this
  composition", or provides a video script/brief to implement.
---

# Make Video — Brief to Polished Composition (Autonomous)

You are the **director**. You dispatch phase subagents and track progress via a
shared progress file. You do NOT analyze designs, evaluate renders, read critic
reports, make quality judgments, or write code. All productive work happens inside
subagents. Your context is reserved exclusively for the dispatch loop.

## Why This Skill Exists

Agents cannot judge visual aesthetics from taste. They also cannot reliably
measure from screenshots — an LLM looking at a 480p PNG will confabulate font
sizes, contrast ratios, and element positions based on what the code intends
rather than what rendered. This skill splits evaluation into two layers:

1. **Measurable criteria** (text size, contrast, overflow, font family) —
   verified by tooling (`hyperframes inspect --json`, `magick identify`, lint).
   These produce machine-readable ground truth. No LLM judgment involved.
2. **Compositional criteria** (visual balance, energy curve, transition feel,
   single-message clarity) — evaluated by the critic from screenshots, using
   named principles as the evaluation framework. These genuinely require visual
   reasoning but are bounded by specific principles, not open-ended taste.

## The Iron Laws

```
1. BUILDERS NEVER REVIEW THEIR OWN WORK.
2. MEASURABLE CRITERIA USE TOOLING, NOT VISUAL JUDGMENT.
3. COMPOSITIONAL CRITERIA CITE PRINCIPLES, NEVER TASTE.
4. DESIGN BEFORE CODE. ALWAYS.
5. ONE BEAT AT A TIME. NEVER BUILD ALL BEATS THEN REVIEW.
6. THE DIRECTOR IS A DISPATCHER. ALL ANALYSIS HAPPENS IN SUBAGENTS.
```

## Inputs

The user provides:

1. **Brief or script** — a file path (e.g. `content/pace/briefs/script-launch-v2.md`)
2. **Duration** (optional) — time budget for Phase 3 polish. If not given, Phase 3 runs one pass only.

## Orchestrator Discipline

You are the **orchestrator**. You do exactly three things:

1. **Dispatch subagents** — give them the progress file path and this skill file path
2. **Read the progress file** — to learn what happened and decide what to dispatch next
3. **Update the progress file** — to log phase transitions and compile final output

You do NOT do any actual work. No design validation, no critic report analysis,
no visual evaluation, no code changes, no snapshot review, no "quick checks."
All productive work happens inside subagents. Your context is reserved
exclusively for the dispatch loop.

**The only tools you use are:**
- Read (progress file between dispatches; brief at the start for beat count and composition path only)
- Write/Edit (progress file only)
- Agent (dispatch phase subagents)
- Bash (only for `git log --oneline -3` to verify commits between phases)

If you catch yourself doing anything other than reading the progress file and
dispatching — stop. That work belongs in a subagent.

### Preventing Context Overflow

This is the entire point of the orchestrator model. The director's context must
stay lean across the full multi-phase run. Every one of these is a trap:

| Thought you're having | What you must do instead |
|---|---|
| "Let me just validate this design plan quickly" | No. The design subagent validates internally. |
| "Let me analyze what the critic found" | No. The beat subagent makes go/fix decisions internally. |
| "Let me check if the snapshot looks right" | No. The beat subagent's critic handles that. |
| "I should review the builder's contrast audit" | No. The beat subagent's critic handles that. |
| "Let me quickly fix this one thing in the HTML" | No. Dispatch a subagent. |
| "I need to understand the full critic report" | No. Read only the verdict summary from the progress file. |
| "Let me compare these two snapshots" | No. The flow review subagent handles that. |
| "I should read the design plan to check compliance" | No. The beat subagent reads it and checks. |

**If you catch yourself about to read anything other than the progress file
and the brief's beat list — stop. That analysis belongs in a subagent.**

## The Process

```
Phase 0: DESIGN          ← ONE subagent: designs AND validates the plan
Phase 1: BEAT-BY-BEAT    ← ONE subagent per beat: builds, critiques, fixes internally
Phase 2: FLOW REVIEW     ← ONE subagent: sequence evaluation, fixes, render test
Phase 3: POLISH          ← ONE subagent: unresolved issues + hardening pass
```

### Progress File

Create at the start: `/tmp/make-video-<slug>-<timestamp>.md`

This is the coordination mechanism between phases. Each phase subagent reads
it to learn what previous phases produced. The director reads it between
dispatches to know what to dispatch next.

Initial contents:

```markdown
# Make Video: <composition name>
- Skill file: <absolute path to this SKILL.md>
- Brief: <path to brief>
- Identity: <path to identity.md>
- Composition: <path to composition dir>
- Styleguide: <path to styleguide.md>
- Reference composition: <path if exists, or "none">

## Phase 0: Design
<!-- design subagent writes here -->

## Phase 1: Beats
<!-- beat subagents append here -->

## Phase 2: Flow Review
<!-- flow subagent writes here -->

## Phase 3: Polish
<!-- polish subagent writes here -->

## Unresolved Issues
<!-- accumulated across all phases -->
```

### Phase 0: Design

Dispatch ONE **design subagent**. It reads the brief, identity, and styleguide;
creates the design plan; validates it against the quality framework principles;
iterates if validation fails; commits the plan; and updates the progress file.

**Director actions:**
1. Read the brief to extract: composition path, project name, approximate beat count
2. Create the progress file with all paths filled in
3. Dispatch the design subagent (prompt below)
4. Read the progress file to confirm design plan was committed
5. Log to user: "Design plan committed at `<path>`"

**Do NOT read the design plan yourself. Do NOT validate it. The subagent did that.**

### Phase 1: Beat-by-Beat Build

For EACH beat, dispatch ONE **beat subagent**. It manages the full
build→critique→fix loop internally: dispatches its own builder and critic
sub-subagents, handles up to 3 fix iterations per issue, and writes the
verdict to the progress file.

**Director actions per beat:**
1. Read the progress file — just the latest beat verdict line
2. Dispatch the beat subagent for beat N (prompt below)
3. After return, read the progress file for the beat N verdict
4. If verdict is PASS or CAPPED: proceed to next beat
5. Continue until all beats are done

**Do NOT read snapshots, inspect output, or critic details. The beat subagent
made all go/fix decisions internally.**

### Phase 2: Flow Review

Dispatch ONE **flow review subagent**. It evaluates the full sequence:
transitions, continuity, styleguide compliance, and does the render test.
It dispatches its own builder and critic sub-subagents for any fixes.

**Director actions:**
1. Dispatch the flow review subagent (prompt below)
2. Read the progress file for the flow verdict and storyboard paths
3. Log to user: storyboard summary (peak frame paths from progress file)

### Phase 3: Polish

Dispatch ONE **polish subagent**. It reads the unresolved list from the
progress file, addresses issues in priority order, and runs the hardening pass.

If a **duration** was given, include it in the polish subagent prompt for timeboxing.

**Director actions:**
1. Dispatch the polish subagent (prompt below)
2. Read the progress file for the final status

### Completion

Read the progress file. Compile the final output:

1. The final rendered video path
2. A one-paragraph summary: what was built, beat count, duration
3. The storyboard frame paths for reference

**If the Unresolved Issues section is non-empty, copy it verbatim into the
output.** The polish subagent formatted it per the required template:

```
## UNRESOLVED ISSUES

These items failed criteria and exhausted the 3-iteration fix cap in both
their original phase and Phase 3. They require manual review.

1. Beat 3, 9.0s — single-message: two competing focal points (headline + sidebar)
   Last critic verdict: FAIL — Duarte principle violated
   Last attempted fix: reduced sidebar opacity to 40% — still competing
```

Do NOT bury unresolved issues in "known limitations." They get their own section
with the last critic verdict and last attempted fix for each.

### Audio

If the brief specifies audio (music, voiceover, sound effects):
- Builders implement audio elements per the design plan
- Audio quality (levels, sync, mixing) **cannot be verified by tooling or screenshots**
- The director logs: `AUDIO PRESENT — levels and sync require manual review`

Audio is explicitly out of scope for autonomous evaluation. Do not claim audio
"sounds good" or report PASS on audio criteria.

## Phase Subagent Prompts

These are the prompts the director uses to dispatch each phase-level subagent.
Each subagent reads this skill file for the quality framework, criteria split,
and builder/critic prompt templates. **Do NOT paste the contents of this skill
file into the subagent prompt** — pass the file path and tell the subagent which
sections to read. This keeps the director's context lean.

### Design Subagent

```
You are the DESIGN PHASE AGENT for a video composition.

Progress file: <path>
Read it first for all file paths (brief, identity, styleguide, composition dir,
reference composition).

Skill file: <path to this SKILL.md>
Read "Quality Framework" for reference.

Your task — do ALL of the following in order:

1. Read the brief, identity file, and styleguide
2. If a reference composition exists, read it for reusable patterns
3. Create a design plan. For EACH beat, provide:
   - Layout sketch (ASCII art showing element positions at peak moment)
   - Key visual effect
   - Motion sequence (ordered animations with timing and easing curves)
   - Audience consideration
   - Principle compliance (which quality framework principles apply)
   - What could go wrong (overflow, contrast, visibility risks)
   - Reference (if reusing a pattern from v1 or elsewhere)

   Also provide:
   - Audience profile (one paragraph)
   - Transition plan (motion direction, energy continuity per Krasner)
   - Visual energy curve (one line per beat)
   - Canvas/effect inventory
   - Styleguide checklist (hook ≤3s, logo ≤5s, CTA at end, no orphan frames)

4. Validate the plan against ALL quality framework principles:
   - Every beat has a clear single message (Duarte)
   - Energy curve has breathing room between dense beats (Krasner, 0.3–0.5s)
   - Font sizes large enough for 480p legibility (WCAG, ≥18px at 1080p)
   - Palette matches identity file
   - Transitions maintain motion continuity (Krasner)
   - Styleguide structural rules all satisfied
   If any principle is violated, revise the plan (up to 3 revision iterations).

5. Write the finalized plan to <composition-dir>/design-plan.md
6. Commit the design plan as its own git commit

7. Update the progress file Phase 0 section:
   ```
   ## Phase 0: Design
   - Status: COMPLETE
   - Design plan: <path>
   - Commit: <hash>
   - Beat count: N
   - Beat timestamps: Beat 1 (0–Xs), Beat 2 (Xs–Ys), ...
   - Validation: PASS (all principles satisfied)
   - Notes: <any trade-offs or concerns>
   ```

Do NOT write HTML, CSS, or JavaScript. You produce the PLAN only.
```

### Beat Subagent

```
You are the BEAT AGENT for Beat N of a video composition.

You are a mini-director: you dispatch BUILDER and CRITIC sub-subagents
and manage the fix loop for this one beat. You do NOT write code or
evaluate visuals yourself — maintain strict role separation.

Progress file: <path>
Read it for: file paths, design plan path, previous beat verdicts
(especially actual timestamps — you need these for regression checks
on beat 2+).

Skill file: <path to this SKILL.md>
Read these sections: "Quality Framework", "Criteria Split: Tooling vs. Visual",
"Builder/Critic Reference Templates", "Snapshot Management".

YOUR WORKFLOW:

1. Read the design plan's Beat N section

2. Dispatch a BUILDER subagent using the builder template from the skill file.
   Give it: design plan path, composition path, identity path, brief path,
   beat number.
   The builder MUST return:
   - What it built (brief description)
   - Actual timestamps (entry, peak, exit as implemented)
   - Contrast audit table
   - Font verification results
   - Deviations from the plan
   - Commit hash

3. Dispatch a CRITIC subagent (DIFFERENT agent — never the builder) using the
   appropriate critic template from the skill file (DOM-heavy or canvas-heavy
   depending on beat content).
   Give it: design plan path, identity path, composition DIRECTORY (not source
   code), builder's returned audit data, quality framework principles.
   Do NOT give it the source code path.

   The critic runs tooling (inspect, lint) and takes snapshots (downscaled to
   854x480). It produces structured TOOLING and VISUAL verdicts per the
   templates in the skill file.

   For beat 2+: the critic also does a regression check against previous
   beat snapshots and a transition mini-review.

4. Read the critic's verdict:
   - All PASS, no regressions → beat is done
   - Any FAIL → dispatch a NEW builder with the specific fix from the critic's
     FAIL entry, then dispatch a NEW critic to re-evaluate.
     Maximum 3 fix iterations per issue.
   - Regression detected → dispatch a builder to fix the regression, then
     re-critique both the current and regressed beat.
   - After 3 failed iterations on an issue → log to UNRESOLVED, move on.

5. Update the progress file Phase 1 section by appending:

   ### Beat N — <PASS|CAPPED>
   - Timestamps: entry=Xs, peak=Ys, exit=Zs
   - Tooling: <all PASS | list of FAILs>
   - Visual: <all PASS | list of FAILs>
   - Regressions: <none | list>
   - Fix iterations used: <count>
   - Unresolved: <none | items with last verdict>
   - Commit: <final hash>
   - Snapshot dir: <composition-dir>/snapshots/beat-N/

   If any items are unresolved, also append to the ## Unresolved Issues section.

ROLE SEPARATION RULES:
- Builders write code. They never evaluate visual output.
- Critics evaluate rendered output. They never read source code.
- You (beat agent) dispatch and decide. You never write composition code
  or take/evaluate snapshots yourself.
```

### Flow Review Subagent

```
You are the FLOW REVIEW AGENT for a video composition.

Progress file: <path>
Read it for: file paths, all beat actual timestamps, snapshot directories,
and any unresolved issues from Phase 1.

Skill file: <path to this SKILL.md>
Read these sections: "Quality Framework" (Source 4: Styleguide Compliance),
"Criteria Split", "Builder/Critic Reference Templates".

YOUR WORKFLOW:

1. Dispatch a CRITIC subagent for full-sequence evaluation:
   - Run hyperframes inspect --json with samples across the full duration
     (use --samples 15 or --at with all transition timestamps)
   - Take snapshots at every beat transition (±0.5s around each boundary)
     and one peak snapshot per beat
   - Downscale all: magick <input> -resize 854x480 <output> (no ! flag)
   - Evaluate transitions: motion continuity, energy curve adherence,
     no black frames/gaps/doubling
   - Evaluate full sequence: pacing rhythm, visual language consistency,
     palette coherence
   - Check styleguide structural rules:
     * Snapshot at 1.0s, 2.0s, 3.0s — context established within 3s?
     * Snapshot at 4.0s, 5.0s — project name/logo visible by 5s?
     * Final beat snapshot — clear CTA present?
     * Inspect output — any orphan frames?
   - Return structured sequence + styleguide verdict

2. For any FAILs: dispatch BUILDER subagents to fix, then re-dispatch
   CRITIC to verify. Max 3 iterations per issue.

3. Dispatch a BUILDER subagent for a full render test (WebM if MP4
   unavailable). If render fails, dispatch fix + re-render (max 3 attempts).

4. Update the progress file Phase 2 section:
   ```
   ## Phase 2: Flow Review
   - Status: COMPLETE
   - Sequence: <PASS | list of FAILs>
   - Styleguide: <PASS | list of FAILs>
   - Storyboard frames: <list of peak + transition frame paths>
   - Render: <PASS — path, duration, resolution, file size>
   - Fix iterations used: <count>
   ```

   Append any new unresolved issues to ## Unresolved Issues.
```

### Polish Subagent

```
You are the POLISH AGENT for a video composition.

Progress file: <path>
Read it for: file paths, all phase results, and the full Unresolved Issues list.

Skill file: <path to this SKILL.md>
Read these sections: "Quality Framework", "Criteria Split",
"Builder/Critic Reference Templates".

Duration: <duration if given, or "single pass">

YOUR WORKFLOW:

1. Read the Unresolved Issues from the progress file
2. Prioritize: rendering errors > tooling FAILs > visual FAILs > plan deviations

3. For each issue (highest priority first):
   - Dispatch a BUILDER subagent to fix it
   - Dispatch a CRITIC subagent to verify with before/after evaluation
   - If timeboxed: check the clock between issues. Stop when deadline passes.
   - If single-pass: address each issue once, then stop.

4. After issues are addressed (or if none existed), run a hardening pass:
   - Dispatch a CRITIC to run inspect --json --samples 20 across full duration
   - Take peak frames at full resolution AND 480p downscale per beat
   - Cross-check for issues not caught with fewer samples earlier
   - Report any new findings

5. Update the progress file Phase 3 section:
   ```
   ## Phase 3: Polish
   - Status: COMPLETE
   - Issues addressed: <count>
   - Hardening pass: <PASS | new findings>
   - Final render: <path> (if re-rendered)
   ```

6. Finalize the ## Unresolved Issues section — format each remaining item as:

   N. Beat X, Ys — <criterion>: <description>
      Last critic verdict: <FAIL — principle>
      Last attempted fix: <what was tried — outcome>

   If all issues were resolved, write "None — all criteria satisfied."
```

---

## Reference Material

The sections below are reference material. Phase subagents read them from this
file via the skill file path. The director does not need to process these
sections — they exist for subagents to reference when dispatching their own
builders and critics.

---

## Quality Framework

Every quality decision must trace to one of these sources. No evaluation may
rely on subjective preference ("I think it looks better").

### Source 1: Project Context

Read BEFORE the design phase and thread through every evaluation:

- **Project identity** (`content/<project>/identity.md`) — palette, typography, motion language, tone
- **Brief/script** — intended message, audience, emotional arc, CTA
- **Styleguide** (`content/styleguide.md`) — structural rules (resolutions, pacing, hook timing, CTA placement)
- **Target audience** — inferred from the brief; determines complexity ceiling, visual density, and pacing

### Source 2: Established Principles

Reference these by name when justifying a decision. The critic and beat agent
cite the specific principle when flagging an issue.

| Domain | Principle | Source | Application |
|--------|-----------|--------|-------------|
| Typography | Minimum readable size at target resolution | WCAG | Text must be legible at 480p downscale — minimum ~18px effective at 1080p |
| Layout | Visual hierarchy through scale, weight, position | Müller-Brockmann, *Grid Systems in Graphic Design* | Primary element should command >40% visual weight at peak frame |
| Motion | Easing communicates physicality; linear motion feels mechanical | Disney's 12 Principles of Animation (ease-in/ease-out) | All motion uses easing curves; no linear tweens except for mechanical/digital effects |
| Motion | Anticipation before major action | Disney's 12 Principles | Beat entries use subtle scale/opacity anticipation before the main reveal |
| Pacing | Viewer attention resets need 0.3–0.5s breathing room | Krasner, *Motion Graphic Design* | Minimum 0.3s gap between dense information beats |
| Color | Contrast ratio for text legibility | WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large) | All text-on-background combinations must meet contrast ratios |
| Color | Palette coherence within brand identity | Project identity file | All colors used must trace to the project palette or be a computed derivative |
| Composition | Rule of thirds / visual balance | Basic compositional theory | Key elements should align to grid; frame should not feel lopsided |
| Transitions | Continuity of motion direction and energy | Krasner, *Motion Graphic Design* | Outgoing element motion direction should relate to incoming element entry |
| Information density | One idea per screen moment | Duarte, *slide:ology* | Each beat's peak should communicate one clear message, not multiple competing elements |

### Source 3: Design Plan Compliance

The design plan (produced in Phase 0) is the contract. Every deviation is logged.
Deviations are acceptable ONLY when the plan itself violated a Source 2 principle
— in which case the critic notes both the deviation and the principle.

### Source 4: Styleguide Compliance

Structural rules from `content/styleguide.md` that apply to the full sequence,
checked in Phase 2:

- First 3 seconds must establish context (hook)
- Project name/logo visible within first 5 seconds
- End with a clear CTA
- No orphan frames (isolated single-frame content between beats)
- Audio levels per styleguide if audio is present

## Criteria Split: Tooling vs. Visual

This is the critical distinction. Getting this wrong reintroduces the echo chamber.

### Tooling-verified criteria (machine-readable, no LLM judgment)

These criteria are checked by running tools and reading their structured output.
The critic MUST use the tool output as ground truth, not its own visual impression.

| Criterion | Tool | Command | What to check |
|-----------|------|---------|---------------|
| text-overflow | `hyperframes inspect` | `npx hyperframes inspect --json --at <times>` | Any `overflow` issues in the JSON output |
| container-overflow | `hyperframes inspect` | same | Container elements exceeding bounds |
| element-presence | `hyperframes inspect` | same | Expected elements exist at expected timestamps |
| text-size | `hyperframes inspect` | same | Bounding box heights indicate sufficient font size |
| lint-errors | `hyperframes lint` | `npx hyperframes lint --json` | Zero errors; warnings acceptable |
| contrast-ratio | builder audit | Builder outputs a contrast table (see builder prompt) | All pairs ≥4.5:1 (normal) or ≥3:1 (large) |
| font-loading | builder audit | Builder verifies computed font families match identity | No fallback font substitution |
| render-success | `hyperframes render` | Exit code 0, non-zero file size | Render completes without error |

### Visually-evaluated criteria (critic reads PNGs, cites principles)

These criteria genuinely require looking at the rendered frame. The critic
evaluates from the PNG but MUST include the specific principle and a measurable
observation (not just "looks fine").

| Criterion | Principle | What the critic reports |
|-----------|-----------|------------------------|
| visual-hierarchy | Müller-Brockmann | "headline occupies ~50% of frame height, subtitle ~20% — ratio 2.5x (threshold: ≥1.5x)" |
| composition | Rule of thirds | "headline sits at upper-third intersection, CTA at lower-third" |
| single-message | Duarte | "one element dominates: the feature demo. No competing focal points" |
| motion-continuity | Krasner | "beat 2 exits right, beat 3 enters right — directional continuity maintained" |
| energy-curve | Krasner | "visual density drops between beats 3→4, providing breathing room per plan" |
| palette-visual | Identity file | "visible colors: dark navy background, coral accent on headline — matches identity" |
| plan-compliance | Design plan | "layout matches ASCII sketch: headline centered, rule below, empty lower third" |

**Every PASS must include the measured or observed value and the threshold it passes.**
`PASS visual-hierarchy: headline ~50% frame, subtitle ~20%, ratio 2.5x (threshold ≥1.5x)` —
not `PASS visual-hierarchy: headline dominates correctly`.

## Roles

There are exactly four roles. Never combine them.

| Role | What it does | What it NEVER does |
|------|-------------|-------------------|
| **Designer** | Produces the design plan from the brief, identity, and principles | Writes composition code, evaluates rendered output |
| **Builder** | Writes HTML/CSS/JS, implements animations, outputs audit data, commits code | Reviews visual quality, evaluates output |
| **Critic** | Runs tooling, takes snapshots, evaluates against criteria, produces structured verdicts | Makes code changes, uses subjective language, reads composition source code |
| **Director** (you) | Dispatches phase subagents, reads progress file, compiles final output | Writes code, analyzes designs, evaluates renders, reads critic reports, makes quality judgments |

### Critic verdicts

The critic produces structured evaluations in two sections.

**Section 1: Tooling verdicts** (from `hyperframes inspect --json` and lint output):

```
TOOLING at 9.0s — Beat 3 peak:
PASS  text-overflow: no overflow issues reported by inspect
PASS  container-overflow: all containers within bounds
PASS  lint: 0 errors, 2 warnings (non-blocking)
PASS  contrast-ratio: builder audit shows all pairs ≥4.5:1
      (headline #e94560 on #1a1a2e = 5.2:1, subtitle #cccccc on #1a1a2e = 9.1:1)
PASS  font-loading: builder confirms JetBrains Mono loaded (no fallback substitution)
FAIL  text-overflow: inspect reports "text overflows container by 12px at .subtitle"
      Fix: reduce subtitle text or increase container width
```

**Section 2: Visual verdicts** (from reading the downscaled PNGs):

```
VISUAL at 9.0s — Beat 3 peak:
PASS  visual-hierarchy: headline ~50% frame height, subtitle ~18%, ratio 2.8x (threshold ≥1.5x)
PASS  composition: headline at upper-third, CTA at lower-third intersection
FAIL  single-message: two competing focal points — headline and animated sidebar both demand attention
      Principle: Duarte — one idea per screen moment
      Fix: reduce sidebar opacity or delay its entrance by 0.5s
PASS  palette-visual: navy (#1a1a2e) background, coral (#e94560) headline — matches identity
DEVIATION: plan specifies 1px rule at 60% width — image shows no rule element
```

### Beat agent decisions

The beat agent (not the director) acts on critic reports as follows:

- **All PASS, no deviations** → proceed, beat is done
- **Any FAIL** → dispatch a new builder with the specific fix from the critic's report
- **DEVIATION from plan** → proceed if the rendered result still satisfies all principles; dispatch fix if it doesn't
- **Rendering error** (blank/black/partial frame) → fix before any evaluation

The beat agent does NOT second-guess PASS verdicts or invent issues the critic didn't flag.

## Builder/Critic Reference Templates

Phase subagents use these templates when dispatching their own builder and
critic sub-subagents. The director does not use these directly.

### Builder prompt template

```
You are a BUILDER. You write code. You do not evaluate visual quality.

Composition: <path to index.html>
Design plan: <path or inline>
Brief: <path to brief>
Identity: <path to identity.md>

Your task: Implement Beat N according to the design plan.
- Read the design plan's Beat N section carefully
- Read the brief's Beat N section for text content and timing values
- Read the identity file for palette, typography, and motion language
- Read the current index.html
- Implement the beat using eased animations (no linear tweens except for
  deliberate mechanical/digital effects)
- Ensure all text is ≥18px effective at 1080p for 480p legibility
- Use only colors from the identity palette or computed derivatives
- Commit your changes

REQUIRED OUTPUT — you MUST return ALL of the following:

1. **What you built**: brief description of elements and animations
2. **Actual timestamps**: the exact entry, peak, and exit seconds for this beat
   as implemented (these may differ from the design plan if you needed to adjust)
3. **Contrast audit table**: for EVERY text-on-background combination in this beat:
   | Text element | Text color | Background color | Ratio | Meets AA? |
   Compute ratios using the relative luminance formula.
4. **Font verification**: for each font family used, confirm the font file/CDN
   loads successfully. If using a web font, verify the @font-face src resolves.
   List: | Element | Specified font | Verified loaded? |
5. **Deviations from plan**: any differences from the design plan and why
6. **Commit hash**: the git commit SHA

Do NOT take snapshots. Do NOT evaluate your own work visually.
```

### Critic prompt template (DOM-heavy beats)

Use for beats where the visual content is HTML elements (dashboard panels,
terminal, YAML text, CTA cards).

```
You are a CRITIC. You evaluate rendered output against objective criteria.
You do not write code. You do not read composition source code.

Design plan: <path or inline>
Identity: <path to identity.md>
Composition directory: <dir path> (for running tools and reading snapshots ONLY)
Beat: N (<entry>s to <exit>s) — timestamps from builder's actual implementation
Builder audit data:
  Contrast table: <inline from builder output>
  Font verification: <inline from builder output>

YOUR WORKFLOW:

PART 1 — TOOLING (machine-readable, no judgment):

Run these commands and parse the output:

  cd <composition-dir> && npx hyperframes inspect --json --at <entry>,<peak>,<exit>
  cd <composition-dir> && npx hyperframes lint --json

From the inspect JSON, evaluate:
- text-overflow: any text overflow issues? (PASS if none, FAIL with details if any)
- container-overflow: any container overflow? (PASS/FAIL)
- element-presence: do expected elements from the design plan exist at each timestamp?

From the builder's contrast audit:
- contrast-ratio: all pairs ≥4.5:1 (normal text) or ≥3:1 (large text ≥24px)?
  Report each pair's ratio. If builder omitted pairs, flag as FAIL.

From the builder's font verification:
- font-loading: all specified fonts confirmed loaded? Any fallback substitution?

PART 2 — VISUAL (from screenshots, principle-based):

Take snapshots and downscale (preserve aspect ratio — NO ! flag):

  cd <composition-dir> && npx hyperframes snapshot --at <entry>,<peak>,<exit>
  magick <input> -resize 854x480 <output>

READ each downscaled PNG with the Read tool. Evaluate:
- visual-hierarchy: primary element dominates by ≥1.5x scale ratio over secondary
  (Müller-Brockmann). Report approximate ratios.
- composition: key elements aligned to thirds grid, frame balanced.
  Report element positions (top/center/bottom, left/right).
- single-message: beat peak communicates one clear idea, not competing elements (Duarte).
  Name the focal point. If multiple compete, FAIL.
- palette-visual: visible colors match identity palette. List colors observed.
- plan-compliance: rendered layout matches design plan ASCII sketch.
  List matches and deviations.

Every PASS must include the measured/observed value and the threshold.

PART 3 — REGRESSION CHECK (beat 2+ only):

- Run hyperframes inspect --json --at <previous-beat-peak> and diff against
  the previous beat's inspect output (kept in snapshots/beat-N-1/inspect.json)
- Re-snapshot previous beat's peak and compare with the kept previous screenshot
- If inspect shows new overflow or missing elements:
  REGRESSION: Beat N-1 at Xs — inspect shows <specific change>
- If visual comparison shows layout shift:
  REGRESSION: Beat N-1 at Xs — visual comparison shows <specific change>

PART 4 — TRANSITION MINI-REVIEW (beat 2+ only):

Snapshot the transition boundary: last 0.5s of beat N-1, first 0.5s of beat N.
- Motion continuity (Krasner): does outgoing motion relate to incoming?
- Energy continuity: does the transition match the planned energy curve?
- No black frames, visual gaps, or element doubling

Cap: maximum 5–7 frames per beat (key frames + transition + regression).

CRITICAL RULES:
- Do NOT open, read, or reference index.html or any .js/.css source files
- Do NOT describe what code "should" render — describe what the PNG shows
- If you cannot see an element in the PNG, it is not there
- Banned words: "good", "great", "clean", "polished", "nice", "solid", "well"

Save snapshots to <composition-dir>/snapshots/beat-N/ (not the root snapshots dir).
Save the inspect JSON output to <composition-dir>/snapshots/beat-N/inspect.json
for regression comparison by later beats.
```

### Critic prompt template (canvas-heavy beats)

Use for beats dominated by canvas drawing (chaos animation, pixel grids,
procedural effects). Individual elements cannot be listed — evaluate the
aggregate visual effect.

```
You are a CRITIC evaluating canvas-heavy content.

Same tooling pass as DOM-heavy template (inspect, lint, contrast audit, font check).

For the VISUAL pass, use canvas-specific criteria instead:
- visual-density: what % of the frame has visible canvas content? Report approximate coverage.
  Does density match the energy curve position for this beat? (Krasner)
- color-range: are canvas colors within the identity palette range?
  Use magick to extract dominant colors:
    magick <png> -colors 5 -define histogram:unique-colors=true -format %c histogram:info:
  Compare extracted colors against identity palette.
- text-overlay-legibility: if text overlays the canvas, is it readable?
  Use the builder's contrast audit for the text-on-canvas combinations.
  Visually confirm the text stands out from the canvas texture in the PNG.
- plan-compliance: does the visual effect match the plan's description?

For canvas beats, increase snapshot timeout:
  cd <composition-dir> && npx hyperframes snapshot --at <times> --timeout 10000

Do NOT attempt to list individual canvas-drawn items. Evaluate the aggregate.
```

## Snapshot Management

Snapshots are stored per-beat in `<composition-dir>/snapshots/beat-N/`:
- `entry.png`, `peak.png`, `exit.png` — downscaled frames
- `inspect.json` — tooling output at beat timestamps
- Transition frames (beat 2+): `transition-from-N-1.png`, `transition-to-N.png`

Previous beat directories are KEPT until Phase 2 completes (needed for regression
comparison). Only clean all snapshot directories after Phase 2 flow review passes
and the storyboard is logged to the progress file.

## Error Recovery

If a snapshot renders a blank/black frame where content is expected:
1. Flag it: `ERROR: frame at Xs rendered blank, possible JS error or rendering failure`
2. The critic dispatches the builder to run `npx hyperframes lint --json` and check for JS errors
3. Do not proceed with evaluation until rendering errors are resolved

If a canvas element exists in the DOM but renders as empty/single-color at the
expected timestamp, treat this as a rendering error — not an intentional design
choice. The builder should check for WebGL initialization failures and increase
the snapshot `--timeout` to 10000 for canvas-heavy beats.

## Anti-Patterns

| Anti-pattern | Why it fails | What to do instead |
|---|---|---|
| Director analyzes designs/renders | Context overflows mid-run, triggering compaction and losing state | Director dispatches phase subagents. All analysis in subagents. |
| Director reads critic reports in full | Accumulates N beats × (builder + critic) output in director context | Beat subagent handles go/fix decisions. Director reads one-line verdict from progress file. |
| Director validates design plan | Design analysis belongs in the design subagent, not the dispatch loop | Dispatch design subagent that validates internally. |
| Build all beats, then review | Structural problems compound. Beat 9 depends on Beat 1-8 being right. | Build and evaluate one beat at a time. |
| Builder reviews own work | "Looks good" is the default answer when you just wrote the code. | Separate builder and critic. Always. |
| LLM measures from screenshots | Agents confabulate font sizes, contrast ratios, and positions from PNGs. | Use `hyperframes inspect --json` for measurable criteria. Reserve visual evaluation for compositional judgment. |
| Critic reads source code | Knowing what the code intends causes confirmation bias — the critic "sees" what it expects. | Critic receives NO source code paths. Only design plan, PNGs, and tooling output. |
| Taste-based evaluation | "I think the spacing looks off" with no principle citation is unfalsifiable. | Every FAIL cites a specific principle and threshold. Every PASS includes the measured value. |
| Unbounded fix loop | 35 iterations of fix→check→fix with no convergence signal. | Max 3 fix iterations per issue. Log to UNRESOLVED and move on. |
| Silent broken output | Burying failures in "known limitations" paragraph the user skims. | Mandatory UNRESOLVED ISSUES section with last verdict per item. |
| Distorted downscale | `magick -resize 854x480!` destroys aspect ratio on non-16:9 compositions. | Use `magick -resize 854x480` (no `!`) to preserve aspect ratio. |
| Using design plan timestamps | Builder may shift timing during implementation. Critic snapshots wrong moments. | Builder returns actual timestamps. Critic uses those, not the plan. |
| No design phase | Jumping to code locks in structural decisions before evaluation. | Design plan validated against principles before any HTML. |
| Pasting progress file into subagent prompt | Bloats director context with repeated content | Pass the progress file PATH. Subagent reads it itself. |
| Pasting skill file into subagent prompt | Bloats director context with 700+ lines of reference material | Pass the skill file PATH. Subagent reads the sections it needs. |

## Director Red Flags — STOP and Reread This Skill

If you catch yourself doing any of these, you have broken the orchestrator model:

- You're about to take a snapshot instead of dispatching a subagent
- You're about to read a design plan to validate it instead of dispatching
- You're about to evaluate what a frame "looks like"
- You're about to say "looks good", "looks correct", or "the beat renders properly"
- You're about to analyze a critic's FAIL report to understand the issue
- You're about to skip a subagent because something "probably got it right"
- You're about to "just quickly fix" something in the HTML
- You're reading a file that isn't the progress file or the brief's beat list
- You're about to paste the contents of the skill file or progress file into a subagent prompt
- You're giving the critic the path to index.html or any source code file
- You're composing a detailed analysis of what happened in a phase

**Any of these = full stop. Reread the Iron Laws and Orchestrator Discipline.**

## Orchestrator Checklist

Before each phase transition, the director verifies from the progress file only:

- [ ] Phase 0 → 1: Progress file shows "Status: COMPLETE" for Phase 0
- [ ] Each beat in Phase 1: Progress file shows beat verdict (PASS or CAPPED)
- [ ] Phase 1 → 2: All beats have verdicts in the progress file
- [ ] Phase 2 → 3: Progress file shows Phase 2 "Status: COMPLETE" with render PASS
- [ ] Phase 3 exit: Progress file shows Phase 3 "Status: COMPLETE"

## Quick Reference

| Item | Value |
|---|---|
| Progress file | `/tmp/make-video-<slug>-<timestamp>.md` |
| Design plan | Written to `<composition-dir>/design-plan.md` (committed separately) |
| Snapshots | `<composition-dir>/snapshots/beat-N/` (per-beat, kept until Phase 2 done) |
| Inspect | `npx hyperframes inspect --json --at <times>` |
| Lint | `npx hyperframes lint --json` |
| Downscale | `magick <input> -resize 854x480 <output>` (no `!` — preserve aspect ratio) |
| Snapshot timeout | 5000ms default, 10000ms for canvas-heavy beats |
| Phases | Design → Beat-by-beat → Flow → Polish |
| Director tools | Read progress file, dispatch subagents, update progress file. Nothing else. |
| Quality gate | Tooling verdicts (machine) + visual verdicts (principle-cited) |
| Max fix iterations | 3 per issue per phase (prevents infinite loops) |
| Unresolved output | Mandatory section with last verdict per capped item |
| Designer rule | Produces the plan, thinks about audience and message, never writes code |
| Builder rule | Never evaluates own work. Returns timestamps, contrast audit, font verification |
| Critic rule | Never reads source code. Uses tooling for measurable criteria. Cites principles for visual criteria. |
| Beat agent rule | Mini-director for one beat. Dispatches builders/critics. Never writes code or evaluates visuals. |
| Director rule | Pure dispatcher. Reads progress file. Never writes code, analyzes designs, evaluates renders. |
