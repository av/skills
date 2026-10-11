# Lens library

Each lens is a thinking procedure handed to exactly one proposer. Explore lenses (families A–H) generate new ideas from the topic. Evolve operators (family M) transform ideas already on the ladder.

`scripts/ladder.py <run> lenses` reads this file: `## <letter>. <family>` starts a family, `### <id> · <name>` starts a lens. Keep that shape when adding lenses.

Each entry: **Do** is pasted into the proposer prompt verbatim. **Yields** is what it tends to produce. **Skip when** is when to exclude it with `--exclude`.

Near-duplicate sets: A6/D4 · A2/C5 · C4/G2/G1 · D2/D3 · A3/B5

Lenses in one set converge on the same ideas. `lenses --next` never returns two from one set in a single call.

## A. Transform an existing thing

### A1 · SCAMPER: Substitute
**Do:** Pick one component, material, actor, channel, or rule of the current solution and replace it with something else that does the same job. Propose the version that results.
**Yields:** part swaps. **Skip when:** there is no existing artefact. *Eberle 1971, after Osborn.*

### A2 · SCAMPER: Combine
**Do:** Merge two existing products, features, steps, or audiences into one offering worth more together than apart.
**Yields:** bundles, merged workflows. **Skip when:** the thing is already bloated.

### A3 · SCAMPER: Adapt
**Do:** Find a mechanism that already works for a similar problem in another context and copy it here, naming what maps to what.
**Yields:** borrowed, proven mechanisms. **Skip when:** hard regulatory or physical rules break the borrowed mechanism.

### A4 · SCAMPER: Magnify / Minify
**Do:** Push one attribute (frequency, size, speed, price, granularity, audience size) to an extreme in either direction and design for that extreme.
**Yields:** premium or micro variants, new segments. **Skip when:** the attribute has no meaningful range.

### A5 · SCAMPER: Put to other use
**Do:** Take an existing asset, capability, dataset, or by-product and name a different user or job it could serve.
**Yields:** new markets, by-product value. **Skip when:** the core use is not established yet.

### A6 · SCAMPER: Eliminate
**Do:** Remove the feature, step, role, or cost everyone assumes is required. Propose what makes the thing still work without it.
**Yields:** simpler, cheaper, faster variants. **Skip when:** the part is safety- or compliance-critical.

### A7 · SCAMPER: Reverse / Rearrange
**Do:** Invert order, direction, or roles (user↔provider, pay-before↔pay-after, push↔pull, batch↔stream) and design the resulting flow.
**Yields:** new flows, self-service models. **Skip when:** order is physically or causally fixed.

### A8 · Attribute dependency
**Do:** Pick two variables that are independent today and make one change automatically with the other (price with time of day, interface with user skill, depth with urgency).
**Yields:** adaptive, context-aware designs. **Skip when:** users need predictability more than adaptivity. *SIT, Goldenberg & Mazursky.*

### A9 · Task unification
**Do:** Give a new job to a resource already in the system (often the user, the environment, or an existing artefact) instead of adding a new part.
**Yields:** elegant, near-free designs. **Skip when:** every component is already overloaded. *SIT.*

### A10 · Multiplication / division
**Do:** Copy a component and make the copy do something different, or split the product or process into parts and rearrange them in space or time.
**Yields:** modular, tiered, staged designs. **Skip when:** value comes from being one indivisible thing. *SIT.*

## B. Invent structurally

### B1 · TRIZ: contradiction
**Do:** State the core trade-off as "improving X worsens Y". Refuse to compromise. Resolve it by separating the conflicting needs in time, space, scale, or condition.
**Yields:** trade-off breakers. **Skip when:** the problem is demand or awareness, not a tension between requirements. *Altshuller.*

### B2 · TRIZ: ideal final result
**Do:** Describe the ideal outcome: the function happens by itself, at no cost, with no extra system. Work back to the closest version buildable from resources already present.
**Yields:** ambitious minimal-resource designs. **Skip when:** the task is short-term and tactical. *Altshuller.*

### B3 · TRIZ: inventive principles
**Do:** Apply the two or three most relevant of: segmentation, taking out, local quality, asymmetry, nesting, prior action, dynamism, intermediary, self-service, copying, cheap disposables. Apply them literally and propose the result.
**Yields:** engineering mechanisms. **Skip when:** the problem is purely social or brand. *Altshuller's 40 principles.*

### B4 · Morphological box
**Do:** Break the solution into 4–6 independent dimensions, list 3–5 options per dimension, then pick a coherent combination that nobody ships today.
**Yields:** novel configurations of known parts. **Skip when:** the problem does not decompose. *Zwicky.*

### B5 · Cross-industry analogy
**Do:** Name an unrelated industry that solved a structurally similar problem (hospital triage for a support queue, air-traffic control for job scheduling). Transfer its mechanism and map every part.
**Yields:** mechanisms new to this domain. **Skip when:** the analogy is surface-only; check the structure matches.

### B6 · Biomimicry
**Do:** Ask how nature performs this function (distribution, defence, signalling, repair, scaling, foraging) and translate the biological strategy into a design.
**Yields:** decentralised, self-organising, resilient designs. **Skip when:** the question is pricing or business model. *Benyus.*

### B7 · First principles
**Do:** Reduce the problem to base truths (physics, real costs, human needs). Discard every inherited convention and rebuild a solution from those truths alone.
**Yields:** fundamental, cost-collapsing redesigns. **Skip when:** conventions encode hidden knowledge (safety, regulation).

### B8 · Facet recombination
**Do:** Describe the best known solutions as facets (purpose, mechanism, evaluation, user, data source). Keep the purpose, swap in a mechanism from a distant solution, and propose the hybrid.
**Yields:** grounded novelty. **Skip when:** there are no known solutions to decompose. *Scideator, Radensky et al. 2024.*

## C. Provoke

### C1 · Provocation (PO)
**Do:** State a deliberately absurd claim ("PO: the customer sets the price", "PO: the tool deletes itself after one use"). Use it as a stepping stone and extract a workable idea from its useful part.
**Yields:** non-obvious leaps. **Skip when:** a safe incremental answer is required fast. *de Bono.*

### C2 · Random entry
**Do:** Take the random word the orchestrator supplies. List its properties, force three connections to the problem, and propose the strongest.
**Yields:** unpredictable associations that break obvious-drift. **Skip when:** ideas must stay tightly in scope. *de Bono.*

### C3 · Assumption reversal
**Do:** List the five biggest assumptions about the problem, reverse each, and build a proposal that makes the strongest reversal work.
**Yields:** category challengers. **Skip when:** the assumptions are physical laws. *Michalko.*

### C4 · Worst possible idea
**Do:** Generate ways to make the outcome as bad as possible. Flip the most revealing one into its opposite and propose that.
**Yields:** ideas that remove hidden failure modes.

### C5 · Forced mashup
**Do:** Pick two unrelated products, trends, or technologies and fuse them with this topic into one concept: "X for Y, using Z".
**Yields:** hybrids. **Skip when:** the audience is conservative and mature.

### C6 · Contrarian truth
**Do:** Name something true about this domain that most practitioners would disagree with. Propose the idea that only makes sense if you are right.
**Yields:** asymmetric bets. **Skip when:** you cannot back the claim with evidence. *Thiel, "Zero to One".*

## D. Shift constraints, scale, and time

### D1 · Add a constraint
**Do:** Impose one hard constraint: free, shipped in one day, no screen, no backend, zero configuration, 1/10th the cost. Propose the best design under it.
**Yields:** lean, clever minimum versions. **Skip when:** the constraint makes the core job impossible.

### D2 · Remove a constraint
**Do:** Assume one major limit vanished (infinite budget, perfect model, zero latency, unlimited staff). Design for that, then name the part that ships today.
**Yields:** visionary designs with a present-day wedge.

### D3 · 10x
**Do:** Target a 10x improvement on one metric that matters. Incremental tuning cannot reach it, so propose a different approach.
**Yields:** architectural changes, moonshots. **Skip when:** the task is local optimisation. *Teller, Google X.*

### D4 · Subtraction only
**Do:** Improve the system only by removing things: features, rules, steps, dependencies, meetings. Propose the biggest win from subtraction alone.
**Yields:** simplification, lower maintenance. **Skip when:** a core capability is still missing. *Klotz, "Subtract".*

### D5 · Do things that don't scale
**Do:** Propose a manual, concierge version for the first 10–100 users that delivers the value now and shows what to automate later.
**Yields:** fast validation experiments. **Skip when:** the product needs systemic leverage. *Graham 2013.*

### D6 · Scale shift
**Do:** Solve the problem at a wildly different scale (one person vs a nation, one event vs a billion, one second vs a decade) and bring the insight back.
**Yields:** personalisation or infrastructure ideas.

### D7 · Time shift
**Do:** Move the intervention earlier or later in the user's timeline (prevent instead of fix, defer instead of decide), or solve it as someone in 1950 or 2040 would.
**Yields:** preventive or futurist ideas.

### D8 · Zero-touch
**Do:** Assume the user never performs the task again: an agent, a default, or the environment does it. Propose what must exist for that to be safe and trusted.
**Yields:** automation and delegation designs. **Skip when:** the doing is the point (craft, learning, play).

## E. Users and demand

### E1 · Jobs to be done
**Do:** State the functional, emotional, and social job the user hires this for and what they fire to hire it. Propose a solution to the most underserved part of the job, whatever form it takes.
**Yields:** needs-led repositioning. **Skip when:** there is no human hirer. *Christensen; Ulwick.*

### E2 · Extreme user
**Do:** Design for one extreme user (first-timer, power user, elderly, disabled, offline, adversarial, an AI agent as the user), then generalise what works to everyone.
**Yields:** accessibility and robustness wins. *IDEO, d.school.*

### E3 · Lead users
**Do:** Name what the most advanced users already hack together themselves (scripts, spreadsheets, workarounds) and productise that.
**Yields:** pre-validated features. **Skip when:** the category has no users yet. *von Hippel 1986.*

### E4 · Pain evidence
**Do:** Find real complaints (issues, reviews, forum threads, support tickets, the context you were given). Pick the most frequent unaddressed one and propose the fix, quoting the evidence.
**Yields:** grounded, high-frequency fixes. **Skip when:** there is no reachable evidence.

### E5 · How might we
**Do:** Rewrite the problem as 3–5 "How might we…" questions at different scopes (narrower, broader, flipped, emotional). Answer the one the topic statement did not imply.
**Yields:** reframes. **Skip when:** the problem is already sharply bounded. *Basadur, P&G.*

### E6 · Five whys
**Do:** Ask "why" about the presenting symptom five times to reach a root cause, then propose a fix at the root rather than the symptom.
**Yields:** systemic fixes. **Skip when:** the topic is opportunity-hunting, not a problem. *Toyoda, Ohno.*

### E7 · Kano delighter
**Do:** Sort what exists into basic needs, performance features, and delighters. Propose one delighter users would not think to ask for, or one basic need that is quietly under-delivered.
**Yields:** delight and hygiene ideas. *Kano 1984.*

## F. Strategy and markets

### F1 · Blue Ocean ERRC
**Do:** Fill all four: which factors the field competes on to Eliminate, Reduce, Raise, and Create. Describe the offering that results.
**Yields:** differentiated value curves. **Skip when:** nothing competes. *Kim & Mauborgne 2005.*

### F2 · Wardley evolution
**Do:** Place the value-chain components on genesis → custom → product → commodity. Propose commoditising one, or building new value on one that just became a commodity.
**Yields:** platform, timing, make-vs-buy plays. **Skip when:** the question is a single small feature. *Wardley.*

### F3 · Unbundle / rebundle
**Do:** Extract one valuable function from a bundled incumbent and serve it far better, or bundle scattered point tools into one.
**Yields:** wedges and suites. **Skip when:** users value the integration itself.

### F4 · Platform
**Do:** Turn the thing into a platform where others create value (API, plugins, marketplace, shared content). Name the network effect and the cold-start fix.
**Yields:** leverage plays. **Skip when:** core value is unproven. *Parker, Van Alstyne & Choudary.*

### F5 · Business-model swap
**Do:** Keep the product fixed and radically change one canvas block: revenue model, channel, segment, key partner, or cost structure.
**Yields:** model innovation. **Skip when:** the question is purely technical. *Osterwalder.*

### F6 · Bottleneck
**Do:** Find the single constraint that limits the whole system's throughput. Propose how to exploit it, subordinate everything else to it, then lift it.
**Yields:** throughput wins. **Skip when:** there is no flow to speak of. *Goldratt, "The Goal".*

### F7 · Weakest funnel stage
**Do:** Pick the weakest of acquisition, activation, retention, referral, revenue, and propose the highest-leverage idea for that stage only.
**Yields:** growth experiments. **Skip when:** growth is not the goal. *McClure, AARRR.*

## G. Consequences and futures

### G1 · Premortem
**Do:** Assume the obvious plan failed badly a year from now. List the most plausible causes and propose the design that makes the top cause impossible.
**Yields:** risk-removing designs. *Klein 2007.*

### G2 · Inversion
**Do:** Ask what would guarantee failure or achieve the opposite goal, then propose a strategy that systematically avoids every item.
**Yields:** robust strategies. *Jacobi; Munger.*

### G3 · Second-order effects
**Do:** Trace "and then what?" three steps out for the obvious solution. Propose an idea that exploits or avoids the downstream effects others ignore.
**Yields:** contrarian, system-aware ideas. *Marks; Hardin.*

### G4 · Working backwards
**Do:** Write the launch headline and the first customer quote for the ideal outcome, then derive the shortest path that makes them true.
**Yields:** outcome-anchored proposals. **Skip when:** there is no target outcome. *Amazon PR/FAQ; Robinson's backcasting.*

### G5 · Why now
**Do:** Name what changed in the last 12–24 months (a capability, a price drop, a regulation, a behaviour). Propose the idea that was impossible or uneconomic before that change.
**Yields:** timely, adjacent-possible bets. *Kauffman's adjacent possible.*

## H. Perspective

### H1 · Outsider expert
**Do:** Pick a profession far from this domain (pilot, chef, ER nurse, librarian, game designer). Say how they would see the problem and propose what their craft would do.
**Yields:** imported expertise.

### H2 · Competitor's attack
**Do:** You are a well-funded rival whose goal is to make the current approach obsolete. Propose the product or move you would ship.
**Yields:** disruptive threats worth pre-empting.

### H3 · Disney passes
**Do:** As Dreamer, write the boldest version. As Realist, make it buildable. As Critic, remove its biggest weakness. Propose what survives all three.
**Yields:** ambitious but grounded ideas. **Skip when:** the problem is tiny. *Dilts 1994.*

### H4 · Green hat
**Do:** Generate only alternatives to how this is done now, no evaluation. Propose the alternative that is furthest from current practice yet still coherent.
**Yields:** pure divergence. *de Bono, Six Thinking Hats.*

## M. Evolve operators

Used only on ideas already on the ladder. The proposer reads the parent idea and its critique.

### M1 · Fix the objection
**Do:** Take the parent's strongest objection from its critique and redesign the idea so the objection no longer applies, without losing what made it win.
**Yields:** hardened winners.

### M2 · Push to 10x
**Do:** Keep the parent's core insight and make it ten times bolder in reach, depth, or automation. Name what has to change to make that real.
**Yields:** ambitious descendants.

### M3 · Crossover
**Do:** Combine the strongest mechanism of parent 1 with the strongest mechanism of parent 2 into one idea that beats both. Drop everything else.
**Yields:** hybrids of winners. *Needs two parents.*

### M4 · Strip to the core
**Do:** Remove everything from the parent that is not its single load-bearing insight. Propose the smallest version that still delivers most of the value.
**Yields:** cheaper, faster-to-ship variants.

### M5 · Counter-idea
**Do:** Identify where the parent fails (users it ignores, cases it breaks, costs it imposes). Propose a different idea that wins exactly there.
**Yields:** challengers to a dominant leader.

### M6 · SCAMPER the winner
**Do:** Apply the one SCAMPER move (substitute, combine, adapt, magnify, put to other use, eliminate, reverse) that most improves the parent, and propose the result.
**Yields:** local variants.

### M7 · Transplant
**Do:** Keep the parent's mechanism and apply it to a different user, job, or part of the topic where it would matter more.
**Yields:** repositioned winners.
