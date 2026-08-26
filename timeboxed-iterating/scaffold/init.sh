#!/usr/bin/env bash
# init.sh — scaffold a complete timeboxed-iterating workspace from a few variables.
#
# Creates ~/.harness/timeboxed/<slug>/ ready to run:
#   prompts/   initialiser.md, builder.md, sub-subagent.md, measurement.md
#              (variable-substituted from this scaffold's template files)
#   progress.md   the digest (single source of truth for volatile values)
#   run-card.md   the static run card / orientation
#   cheatsheet.md seeded but empty of findings (self-populates as subagents run)
#   units/        one file per unit (created on demand)
#
# Usage:
#   init.sh --slug <slug> --goal "<goal>" --mode <finite|open-ended> \
#           [--duration <e.g. 4h|90m|8h>] [--harness-root <dir>] [--force]
#
# Safe to re-run: refuses to overwrite a non-empty workspace unless --force.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SLUG=""
GOAL=""
MODE=""
DURATION=""
HARNESS_ROOT="${HOME}/.harness/timeboxed"
FORCE=0

die() { echo "error: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --slug)         SLUG="${2:-}"; shift 2 ;;
    --goal)         GOAL="${2:-}"; shift 2 ;;
    --mode)         MODE="${2:-}"; shift 2 ;;
    --duration)     DURATION="${2:-}"; shift 2 ;;
    --harness-root) HARNESS_ROOT="${2:-}"; shift 2 ;;
    --force)        FORCE=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$SLUG" ] || die "--slug is required"
[ -n "$GOAL" ] || die "--goal is required"
case "$MODE" in
  finite|open-ended) ;;
  *) die "--mode must be 'finite' or 'open-ended' (got: '${MODE:-}')" ;;
esac

HARNESS="${HARNESS_ROOT%/}/${SLUG}"

# Refuse to clobber a non-empty existing workspace unless --force.
if [ -d "$HARNESS" ] && [ -n "$(ls -A "$HARNESS" 2>/dev/null || true)" ]; then
  if [ "$FORCE" -ne 1 ]; then
    die "workspace $HARNESS already exists and is non-empty; pass --force to overwrite"
  fi
fi

# Compute deadline from --duration if it is Nh / Nm / NhNm; else leave TBD.
STARTED="$(date '+%Y-%m-%d %H:%M %Z')"
DEADLINE="TBD (no --duration given)"
DURATION_DISPLAY="${DURATION:-unbounded}"
if [ -n "$DURATION" ]; then
  secs=0
  if [[ "$DURATION" =~ ^([0-9]+)h([0-9]+)m$ ]]; then
    secs=$(( ${BASH_REMATCH[1]} * 3600 + ${BASH_REMATCH[2]} * 60 ))
  elif [[ "$DURATION" =~ ^([0-9]+)h$ ]]; then
    secs=$(( ${BASH_REMATCH[1]} * 3600 ))
  elif [[ "$DURATION" =~ ^([0-9]+)m$ ]]; then
    secs=$(( ${BASH_REMATCH[1]} * 60 ))
  elif [[ "$DURATION" =~ ^([0-9]+)$ ]]; then
    secs=$(( ${BASH_REMATCH[1]} * 3600 ))   # bare number = hours
    DURATION_DISPLAY="${DURATION}h"
  fi
  if [ "$secs" -gt 0 ]; then
    end_epoch=$(( $(date +%s) + secs ))
    # Portable human time: try GNU date, fall back to BSD date.
    if human="$(date -d "@${end_epoch}" '+%Y-%m-%d %H:%M %Z' 2>/dev/null)"; then :;
    elif human="$(date -r "${end_epoch}" '+%Y-%m-%d %H:%M %Z' 2>/dev/null)"; then :;
    else human="epoch ${end_epoch}"; fi
    DEADLINE="${human} (epoch ${end_epoch})"
  fi
fi

# render <template-path> <dest-path> — literal {{VAR}} substitution via bash.
render() {
  local src="$1" dest="$2" content
  content="$(cat "$src")"
  content="${content//\{\{HARNESS\}\}/$HARNESS}"
  content="${content//\{\{SLUG\}\}/$SLUG}"
  content="${content//\{\{GOAL\}\}/$GOAL}"
  content="${content//\{\{MODE\}\}/$MODE}"
  content="${content//\{\{DURATION\}\}/$DURATION_DISPLAY}"
  content="${content//\{\{DEADLINE\}\}/$DEADLINE}"
  content="${content//\{\{STARTED\}\}/$STARTED}"
  printf '%s\n' "$content" > "$dest"
}

mkdir -p "$HARNESS/prompts" "$HARNESS/units"

render "$SCRIPT_DIR/initialiser.md"   "$HARNESS/prompts/initialiser.md"
render "$SCRIPT_DIR/builder.md"       "$HARNESS/prompts/builder.md"
render "$SCRIPT_DIR/sub-subagent.md"  "$HARNESS/prompts/sub-subagent.md"
render "$SCRIPT_DIR/measurement.md"   "$HARNESS/prompts/measurement.md"
render "$SCRIPT_DIR/progress.md.tmpl" "$HARNESS/progress.md"
render "$SCRIPT_DIR/run-card.md.tmpl" "$HARNESS/run-card.md"

# Seed the cheatsheet: section headings only, no findings yet (it self-populates).
cat > "$HARNESS/cheatsheet.md" <<EOF
# Cheatsheet — ${GOAL}
Read this FIRST. Append any environment fact you had to discover, under the right
heading, before you return — so the next subagent does not re-learn it.

## Environment recipes
## Working commands
## Tool quirks & gotchas
## Auth / access workarounds
EOF

# .gitkeep so an empty units/ survives if the harness itself is versioned.
: > "$HARNESS/units/.gitkeep"

echo "Created timeboxed workspace: $HARNESS"
echo "  $HARNESS/progress.md         (the digest — single source of truth)"
echo "  $HARNESS/run-card.md         (run card)"
echo "  $HARNESS/cheatsheet.md       (seeded, self-populating)"
echo "  $HARNESS/prompts/initialiser.md"
echo "  $HARNESS/prompts/builder.md"
echo "  $HARNESS/prompts/sub-subagent.md"
echo "  $HARNESS/prompts/measurement.md"
echo "  $HARNESS/units/               (one file per unit)"
echo "Mode: $MODE   Timebox: $DURATION_DISPLAY   Deadline: $DEADLINE"
