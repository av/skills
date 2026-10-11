#!/usr/bin/env python3
import argparse
import math
import random
import re
import sys
from pathlib import Path

LENSES = Path(__file__).resolve().parent.parent / "references" / "lenses.md"
EVOLVE_FAMILY = "M"


def read_registry(run):
    ideas = {}
    path = run / "registry.tsv"
    if not path.exists():
        return ideas
    for line in path.read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        iid, gen, origin, lens, parents = (c.strip() for c in (line.split("\t") + [""] * 5)[:5])
        ideas[iid] = {"id": iid, "gen": gen, "origin": origin, "lens": lens, "parents": parents, "name": "", "status": "pending", "note": ""}
    for iid, idea in ideas.items():
        card = run / "ideas" / f"{iid}.md"
        if not card.exists():
            continue
        heading = next((l for l in card.read_text().splitlines() if l.startswith("# ")), f"# {iid}")
        idea["name"] = heading[2:].strip()
        idea["status"] = "unreviewed"
        crit = run / "critiques" / f"{iid}.md"
        if not crit.exists():
            continue
        first = next((l for l in crit.read_text().splitlines() if l.strip()), "")
        m = re.match(r"\s*verdict:\s*(\w+)\s*(.*)", first, re.I)
        verdict = m.group(1).upper() if m else ""
        if verdict in ("KILL", "DUPLICATE"):
            idea["status"] = verdict.lower()
            idea["note"] = m.group(2).strip()
        elif verdict == "KEEP":
            idea["status"] = "ranked"
    return ideas


def read_matches(run, ranked):
    matches = []
    for path in sorted((run / "matches").glob("*.tsv")):
        for line in path.read_text().splitlines():
            cols = [c.strip() for c in line.split("\t")]
            if len(cols) >= 3 and cols[0] in ranked and cols[1] in ranked and cols[2] in (cols[0], cols[1], "tie"):
                matches.append(tuple(cols[:3]))
    return matches


def fit(ids, matches):
    strength = {i: 1.0 for i in ids}
    wins = {i: 1.0 for i in ids}
    games = {i: {} for i in ids}
    for a, b, w in matches:
        wins[a] += 1.0 if w == a else 0.5 if w == "tie" else 0.0
        wins[b] += 1.0 if w == b else 0.5 if w == "tie" else 0.0
        games[a][b] = games[a].get(b, 0) + 1
        games[b][a] = games[b].get(a, 0) + 1
    for _ in range(500):
        nxt = {}
        for i in ids:
            denom = 2.0 / (strength[i] + 1.0) + sum(n / (strength[i] + strength[j]) for j, n in games[i].items())
            nxt[i] = wins[i] / denom
        strength = nxt
    return {i: 1500 + 400 * math.log10(strength[i]) for i in ids}


def standings(run):
    ideas = read_registry(run)
    ranked = {i for i, d in ideas.items() if d["status"] == "ranked"}
    matches = read_matches(run, ranked)
    rating = fit(ranked, matches)
    record = {i: [0, 0, 0] for i in ranked}
    played = {i: set() for i in ranked}
    for a, b, w in matches:
        for me, other in ((a, b), (b, a)):
            record[me][0 if w == me else 2 if w == "tie" else 1] += 1
            played[me].add(other)
    order = sorted(ranked, key=lambda i: (-rating[i], i))
    return ideas, order, rating, record, played, matches


def lens_table():
    families, lenses, family, twins = {}, {}, None, {}
    for line in LENSES.read_text().splitlines():
        if line.startswith("Near-duplicate sets:"):
            for group in line.split(":", 1)[1].split("·"):
                ids = [i.strip() for i in group.split("/") if i.strip()]
                for i in ids:
                    twins.setdefault(i, set()).update(x for x in ids if x != i)
            continue
        m = re.match(r"^## ([A-Z])\. (.+)", line)
        if m:
            family = m.group(1)
            families[family] = m.group(2).strip()
            continue
        m = re.match(r"^### ([A-Z]\d+) · (.+)", line)
        if m and family:
            lenses[m.group(1)] = (family, m.group(2).strip())
    return families, lenses, twins


def cmd_board(run, args):
    ideas, order, rating, record, played, matches = standings(run)
    count = lambda *s: sum(d["status"] in s for d in ideas.values())
    print(f"{len(order)} ranked · {len(matches)} judgements · {count('kill')} killed · {count('duplicate')} duplicates · {count('pending', 'unreviewed')} awaiting card or critique")
    anchors = [i for i in order if ideas[i]["origin"] == "anchor"]
    print("rank\tid\trating\tW-L-T\tgen\torigin\tlens\tname")
    for n, i in enumerate(order if args.all else order[: args.top], 1):
        w, l, t = record[i]
        sure = "" if w + l + t >= 4 else "?"
        above = ""
        if anchors and ideas[i]["origin"] != "anchor":
            above = f"  [above {sum(rating[i] > rating[a] for a in anchors)}/{len(anchors)} anchors]"
        d = ideas[i]
        print(f"{n}\t{i}\t{rating[i]:.0f}{sure}\t{w}-{l}-{t}\t{d['gen']}\t{d['origin']}\t{d['lens']}\t{d['name']}{above}")
    if args.all:
        for i, d in ideas.items():
            if d["status"] in ("kill", "duplicate"):
                print(f"-\t{i}\t{d['status']}\t-\t{d['gen']}\t{d['origin']}\t{d['lens']}\t{d['name']} — {d['note']}")


def cmd_pairs(run, args):
    ideas, order, rating, record, played, matches = standings(run)
    rng = random.Random(args.seed if args.seed is not None else len(matches))
    pairs = []
    if args.final:
        pool = order[: args.final]
        pairs = [(pool[x], pool[y]) for x in range(len(pool)) for y in range(x + 1, len(pool))]
    else:
        busy = {i: 0 for i in order}
        anchors = {i for i in order if ideas[i]["origin"] == "anchor"}

        def take(i, j):
            pairs.append((i, j) if rng.random() < 0.5 else (j, i))
            for x, y in ((i, j), (j, i)):
                played[x].add(y)
                busy[x] += 1

        def open_to(i):
            return [j for j in order if j != i and j not in played[i] and busy[j] < 2]

        for i in sorted(order, key=lambda i: (len(played[i]), rng.random())):
            while len(pairs) < args.n and len(played[i]) < args.games and busy[i] < 2:
                others = open_to(i)
                if not others:
                    break
                if order[0] in others:
                    pick = order[0]
                elif i not in anchors and not played[i] & anchors and anchors & set(others):
                    pick = min(anchors & set(others), key=lambda a: abs(rating[a] - rating[i]))
                else:
                    pick = min(others, key=lambda j: (abs(rating[j] - rating[i]), rng.random()))
                take(i, pick)
        for i in order[: args.top]:
            if len(pairs) >= args.n:
                break
            others = [j for j in open_to(i) if j in order[: args.top]]
            if others and busy[i] < 2:
                take(i, min(others, key=lambda j: abs(rating[j] - rating[i])))
    for a, b in pairs:
        print(f"{a}\t{b}")


def cmd_stats(run, args):
    ideas = read_registry(run)
    gens = sorted({d["gen"] for d in ideas.values()}, key=lambda g: (len(g), g))
    print("gen\tideas\tcritiqued\tkilled\tduplicates\tunique rate")
    for g in gens:
        batch = [d for d in ideas.values() if d["gen"] == g]
        done = [d for d in batch if d["status"] in ("kill", "duplicate", "ranked")]
        dup = sum(d["status"] == "duplicate" for d in done)
        kill = sum(d["status"] == "kill" for d in done)
        rate = f"{1 - dup / len(done):.0%}" if done else "-"
        print(f"{g}\t{len(batch)}\t{len(done)}\t{kill}\t{dup}\t{rate}")


def cmd_lenses(run, args):
    families, lenses, twins = lens_table()
    used = {}
    for d in read_registry(run).values():
        for lens in d["lens"].split("+"):
            used[lens] = used.get(lens, 0) + 1
    fam_use = {}
    for l, n in used.items():
        if l in lenses:
            fam_use[lenses[l][0]] = fam_use.get(lenses[l][0], 0) + n
    if args.coverage:
        for fam, title in families.items():
            ids = [l for l, (f, _) in lenses.items() if f == fam]
            print(f"{fam}\t{title}\t{fam_use.get(fam, 0)} ideas\t{sum(not used.get(l) for l in ids)}/{len(ids)} lenses unused")
        return
    rng = random.Random(args.seed if args.seed is not None else sum(used.values()))
    crowded = sorted((f for f in families if f != EVOLVE_FAMILY), key=lambda f: -fam_use.get(f, 0))[: args.skip_top_families]
    pool = [l for l, (f, _) in lenses.items() if (f == EVOLVE_FAMILY) == args.evolve and l not in args.exclude and f not in crowded]
    picked = set()
    for _ in range(min(args.next, len(pool))):
        if not pool:
            break
        best = min(pool, key=lambda l: (lenses[l][0] in picked, used.get(l, 0), fam_use.get(lenses[l][0], 0), rng.random()))
        picked.add(lenses[best][0])
        pool = [l for l in pool if l != best and l not in twins.get(best, ())]
        used[best] = used.get(best, 0) + 1
        fam_use[lenses[best][0]] = fam_use.get(lenses[best][0], 0) + 1
        print(f"{best}\t{families[lenses[best][0]]}\t{lenses[best][1]}")


def main():
    p = argparse.ArgumentParser(prog="ladder.py", description="Pairwise ladder over an ideate run directory.")
    p.add_argument("run", type=Path)
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("board", help="ranked ideas, best first")
    b.add_argument("--top", type=int, default=10)
    b.add_argument("--all", action="store_true", help="every ranked idea plus killed and duplicate ones")
    q = sub.add_parser("pairs", help="next pairs to judge")
    q.add_argument("--n", type=int, default=8)
    q.add_argument("--games", type=int, default=3, help="opponents each idea should have met")
    q.add_argument("--top", type=int, default=8, help="spare pairs go to this many leaders")
    q.add_argument("--final", type=int, default=0, help="round robin among this many leaders")
    q.add_argument("--seed", type=int)
    sub.add_parser("stats", help="kill and duplicate rates per generation")
    l = sub.add_parser("lenses", help="least-used lenses, spread across families")
    l.add_argument("--next", type=int, default=3)
    l.add_argument("--evolve", action="store_true", help="pick evolve operators instead of explore lenses")
    l.add_argument("--coverage", action="store_true")
    l.add_argument("--exclude", nargs="*", default=[])
    l.add_argument("--skip-top-families", type=int, default=0, help="leave out the N most-used families")
    l.add_argument("--seed", type=int)
    args = p.parse_args()
    if not args.run.is_dir():
        sys.exit(f"no run directory: {args.run}")
    {"board": cmd_board, "pairs": cmd_pairs, "stats": cmd_stats, "lenses": cmd_lenses}[args.cmd](args.run, args)


if __name__ == "__main__":
    main()
