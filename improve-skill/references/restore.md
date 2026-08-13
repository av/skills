# FAIL restore

Step 6 FAIL only. Reuse `$d`, `$skill_dir`, and `$repo` from step 2.
Stop if `$d/baseline/SKILL.md` is missing — do not invent a restore.

The live tree may have paths the baseline does not (`assets/`, extra root
files, new files under `references/`). Overlay the baseline, then delete
those extras so they cannot leak.

```bash
if [ ! -f "$d/baseline/SKILL.md" ]; then
  echo "missing $d/baseline/SKILL.md; stop; do not invent a restore"
  exit 1
fi
cp -R "$d/baseline/." "$skill_dir/"
find "$skill_dir" -mindepth 1 \( -type f -o -type d \) | sort -r | while IFS= read -r p; do
  rel="${p#"$skill_dir"/}"
  if [ ! -e "$d/baseline/$rel" ]; then
    rm -rf "$p"
  fi
done
```

Do not `git commit`. After this script, step 6 still runs `generate.ts` when
`$repo/scripts/generate.ts` exists.
