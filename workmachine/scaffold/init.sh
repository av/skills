#!/usr/bin/env bash
# init.sh — scaffold a complete workmachine workspace from a few variables.
#
# Creates ~/.harness/workmachine/<slug>/ ready to run:
#   prompts/      initialiser.md, planner.md, builder.md, sub-subagent.md, measurement.md
#   machine.md    the machine skeleton (planner subagent fills it in)
#   state.md      current state + event queue + output slot (single source of volatile values)
#   events.md     append-only transition log
#   progress.md   the digest (subagents append one line per unit)
#   run-card.md   static orientation
#   cheatsheet.md seeded, self-populating
#   units/        one file per unit (created on demand)
#
# Usage:
#   init.sh --slug <slug> --goal "<goal>" [--duration <e.g. 4h|90m|2h30m>] \
#           [--harness-root <dir>] [--force]
#
# Safe to re-run: refuses to overwrite a non-empty workspace unless --force.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SLUG=""
GOAL=""
DURATION=""
HARNESS_ROOT="${HOME}/.harness/workmachine"
FORCE=0

die() { echo "error: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --slug)         SLUG="${2:-}"; shift 2 ;;
    --goal)         GOAL="${2:-}"; shift 2 ;;
    --duration)     DURATION="${2:-}"; shift 2 ;;
    --harness-root) HARNESS_ROOT="${2:-}"; shift 2 ;;
    --force)        FORCE=1; shift ;;
    -h|--help)
      sed -n '2,19p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$SLUG" ] || die "--slug is required"
[ -n "$GOAL" ] || die "--goal is required"

HARNESS="${HARNESS_ROOT%/}/${SLUG}"

if [ -d "$HARNESS" ] && [ -n "$(ls -A "$HARNESS" 2>/dev/null || true)" ]; then
  if [ "$FORCE" -ne 1 ]; then
    die "workspace $HARNESS already exists and is non-empty; pass --force to overwrite"
  fi
fi

STARTED="$(date '+%Y-%m-%d %H:%M %Z')"
STARTED_EPOCH="$(date +%s)"
DEADLINE="none"
DEADLINE_EPOCH="none"
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
    secs=$(( ${BASH_REMATCH[1]} * 3600 ))
    DURATION_DISPLAY="${DURATION}h"
  fi
  if [ "$secs" -gt 0 ]; then
    DEADLINE_EPOCH=$(( STARTED_EPOCH + secs ))
    if human="$(date -d "@${DEADLINE_EPOCH}" '+%Y-%m-%d %H:%M %Z' 2>/dev/null)"; then :;
    elif human="$(date -r "${DEADLINE_EPOCH}" '+%Y-%m-%d %H:%M %Z' 2>/dev/null)"; then :;
    else human="epoch ${DEADLINE_EPOCH}"; fi
    DEADLINE="${human}"
  fi
fi

render() {
  local src="$1" dest="$2" content
  content="$(cat "$src")"
  content="${content//\{\{HARNESS\}\}/$HARNESS}"
  content="${content//\{\{SLUG\}\}/$SLUG}"
  content="${content//\{\{GOAL\}\}/$GOAL}"
  content="${content//\{\{DURATION\}\}/$DURATION_DISPLAY}"
  content="${content//\{\{DEADLINE\}\}/$DEADLINE}"
  content="${content//\{\{DEADLINE_EPOCH\}\}/$DEADLINE_EPOCH}"
  content="${content//\{\{STARTED\}\}/$STARTED}"
  content="${content//\{\{STARTED_EPOCH\}\}/$STARTED_EPOCH}"
  printf '%s\n' "$content" > "$dest"
}

mkdir -p "$HARNESS/prompts" "$HARNESS/units"

render "$SCRIPT_DIR/initialiser.md"   "$HARNESS/prompts/initialiser.md"
render "$SCRIPT_DIR/planner.md"       "$HARNESS/prompts/planner.md"
render "$SCRIPT_DIR/builder.md"       "$HARNESS/prompts/builder.md"
render "$SCRIPT_DIR/sub-subagent.md"  "$HARNESS/prompts/sub-subagent.md"
render "$SCRIPT_DIR/measurement.md"   "$HARNESS/prompts/measurement.md"
render "$SCRIPT_DIR/machine.md.tmpl"  "$HARNESS/machine.md"
render "$SCRIPT_DIR/state.md.tmpl"    "$HARNESS/state.md"
render "$SCRIPT_DIR/events.md.tmpl"   "$HARNESS/events.md"
render "$SCRIPT_DIR/progress.md.tmpl" "$HARNESS/progress.md"
render "$SCRIPT_DIR/run-card.md.tmpl" "$HARNESS/run-card.md"

cat > "$HARNESS/cheatsheet.md" <<CS
# Cheatsheet — ${GOAL}
Read this FIRST. Append any environment fact you had to discover, under the right
heading, before you return — so the next subagent does not re-learn it.

## Environment recipes
## Working commands
## Tool quirks & gotchas
## Auth / access workarounds
CS

: > "$HARNESS/units/.gitkeep"

echo "Created workmachine workspace: $HARNESS"
echo "  $HARNESS/machine.md          (the machine — planner fills it in)"
echo "  $HARNESS/state.md            (current state + queue + output)"
echo "  $HARNESS/events.md           (append-only transition log)"
echo "  $HARNESS/progress.md         (digest)"
echo "  $HARNESS/run-card.md         (run card)"
echo "  $HARNESS/cheatsheet.md       (seeded, self-populating)"
echo "  $HARNESS/prompts/{initialiser,planner,builder,sub-subagent,measurement}.md"
echo "  $HARNESS/units/              (one file per unit)"
echo "Timebox: $DURATION_DISPLAY   Deadline: $DEADLINE (epoch $DEADLINE_EPOCH)"
