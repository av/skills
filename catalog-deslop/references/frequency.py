#!/usr/bin/env python3
"""Frequency analysis for prose drafts. Flags statistical watermarks of LLM prose:
overused crutch words, repeated n-grams, and monotonous sentence openers.

Ported from the content-v2 pipeline (frequency.ts). Thresholds are the spec.

Usage: python3 frequency.py <draft.md>
Prints a markdown report to stdout. Always exits 0; an empty report means clean.
"""
import re
import sys
from collections import Counter

# Words LLMs lean on far above human base rates. Flagged at lower thresholds.
AI_CRUTCH_WORDS = {
    "because", "whether", "nobody", "someone", "without", "actually",
    "specific", "specifically", "enough", "means", "directly", "simply",
    "essentially", "particularly", "typically", "precisely", "immediately",
    "intentionally", "explicitly", "mechanically", "certainly", "clearly",
    "fundamentally",
}

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "of", "to",
    "in", "on", "at", "by", "for", "with", "from", "as", "is", "are", "was",
    "were", "be", "been", "being", "it", "its", "this", "that", "these",
    "those", "i", "you", "he", "she", "we", "they", "them", "his", "her",
    "my", "your", "our", "their", "not", "no", "so", "do", "does", "did",
    "have", "has", "had", "will", "would", "can", "could", "should", "there",
    "what", "which", "who", "when", "where", "how", "all", "each", "more",
    "most", "some", "such", "than", "too", "very", "just", "into", "out",
    "up", "down", "over", "about",
}

# (count threshold, per-1000-words threshold)
CRUTCH_THRESHOLD = (6, 2.0)
CONTENT_THRESHOLD = (12, 4.0)
BIGRAM_MIN = 4
TRIGRAM_MIN = 3
FOURGRAM_MIN = 3
OPENER_PCT = 10.0


def strip_markdown(text):
    text = re.sub(r"^```.*?^```", "", text, flags=re.M | re.S)
    text = re.sub(r"^#+ .*$", "", text, flags=re.M)
    text = re.sub(r"`[^`]*`", "", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    return text


def ngrams(words, n):
    return zip(*(words[i:] for i in range(n)))


def main(path):
    text = strip_markdown(open(path, encoding="utf-8").read())
    words = re.findall(r"[a-z][a-z']*", text.lower())
    total = len(words) or 1
    counts = Counter(words)
    sections = []

    rows = []
    for word, count in counts.most_common():
        rate = count / total * 1000
        if word in AI_CRUTCH_WORDS:
            cmin, rmin = CRUTCH_THRESHOLD
            kind = "crutch"
        elif word not in STOP_WORDS and len(word) > 3:
            cmin, rmin = CONTENT_THRESHOLD
            kind = "content"
        else:
            continue
        if count >= cmin and rate >= rmin:
            rows.append(f"- `{word}` ({kind}): {count}x, {rate:.1f}/1000 words")
    if rows:
        sections.append("## Overused words\n" + "\n".join(rows))

    for n, minimum, label in ((2, BIGRAM_MIN, "Bigrams"), (3, TRIGRAM_MIN, "Trigrams"), (4, FOURGRAM_MIN, "Fourgrams")):
        rows = []
        for gram, count in Counter(ngrams(words, n)).most_common():
            if count < minimum:
                break
            if all(w in STOP_WORDS for w in gram):
                continue
            rows.append(f"- \"{' '.join(gram)}\": {count}x")
        if rows:
            sections.append(f"## Repeated {label.lower()} (>= {minimum}x)\n" + "\n".join(rows))

    sentences = [s.strip() for s in re.split(r"[.!?]+\s+", text) if s.strip()]
    openers = []
    for s in sentences:
        m = re.match(r"[^A-Za-z]*([A-Za-z][a-z']*)", s)
        if m:
            openers.append(m.group(1))
    if openers:
        rows = []
        for word, count in Counter(w.lower() for w in openers).most_common():
            pct = count / len(openers) * 100
            if pct >= OPENER_PCT and count >= 3:
                rows.append(f"- {pct:.0f}% of sentences open with \"{word}\" ({count}x)")
        pairs = sum(
            1 for a, b in zip(openers, openers[1:])
            if a.lower() == b.lower() and a.lower() != "i"
        )
        if pairs:
            rows.append(f"- {pairs} consecutive sentence pair(s) share the same opener")
        if rows:
            sections.append("## Sentence openers\n" + "\n".join(rows))

    if sections:
        print(f"# Frequency report ({total} words)\n")
        print("\n\n".join(sections))
    else:
        print(f"# Frequency report ({total} words)\n\nClean. No statistical flags.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
