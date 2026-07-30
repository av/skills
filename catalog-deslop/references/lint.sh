#!/usr/bin/env bash
# Slop lint for prose drafts. Ported from the content-v2 Makefile lint-content target.
# Usage: lint.sh <file.md>
# Exit 0 = clean, 1 = slop indicators found, 2+ = error.
set -uo pipefail

f="${1:?usage: lint.sh <file.md>}"
command -v rg >/dev/null 2>&1 || { echo "Error: rg (ripgrep) is required" >&2; exit 2; }
[ -f "$f" ] || { echo "Error: no such file: $f" >&2; exit 2; }

# Blank out fenced code blocks so line numbers still match the original file.
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
sed '/^```/,/^```/s/.*//' "$f" > "$tmp"

rg --multiline -n -i \
	-e '—' \
	-e ';' \
	-e '\bdelve\b' \
	-e '\btapestry\b' \
	-e '\bleverage\b' \
	-e '\butilize\b' \
	-e '\bseamless(ly)?\b' \
	-e '\blandscape\b' \
	-e '\btestament\b' \
	-e '\bsynergy\b' \
	-e '\bparadigm\b' \
	-e '\bcutting[- ]edge\b' \
	-e '\bgame[- ]changer\b' \
	-e '\binnovative\b' \
	-e '\bgroundbreaking\b' \
	-e '\bcemented\b' \
	-e '\bunpack\b' \
	-e '\bpivotal\b' \
	-e '\bmyriad\b' \
	-e '\bvibrant\b' \
	-e '\bcrucial\b' \
	-e '\bunderscore\b' \
	-e '\bshowcase\b' \
	-e '\bintricate\b' \
	-e '\brevolutionize\b' \
	-e '\bcollapsing\b' \
	-e '\btransformative\b' \
	-e '\bholistic\b' \
	-e '\bspearhead\b' \
	-e '\bquiet(ly)?\b' \
	-e '\bdisrupt(ive)?\b' \
	-e '\bcompounds?\b' \
	-e '\bmatters?\b' \
	-e '\bresonates?\b' \
	-e '\bload[- ]bearing\b' \
	-e "\bin ways that\b" \
	-e "\bin (meaningful|significant|important|profound|fundamental|tangible|concrete) ways\b" \
	-e "\bthat'?s what makes\b" \
	-e "\bthis is what makes\b" \
	-e "\bwhich is what makes\b" \
	-e "\bit is important to note\b" \
	-e "\bin conclusion\b" \
	-e "\bin summary\b" \
	-e "\bto summarize\b" \
	-e "\bas we have seen\b" \
	-e "\blet'?s explore\b" \
	-e "\blet'?s dive( in)?\b" \
	-e "\bwithout further ado\b" \
	-e "\bat the end of the day\b" \
	-e "\bit goes without saying\b" \
	-e "\bmoving forward\b" \
	-e "\bgoing forward\b" \
	-e "\bin today'?s world\b" \
	-e "\bin this day and age\b" \
	-e "\bthe fact of the matter is\b" \
	-e "\bit should be noted( that)?\b" \
	-e "\bneedless to say\b" \
	-e "\bin this section\b" \
	-e "\bas mentioned above\b" \
	-e "\bhaving established\b" \
	-e "\bnow let'?s turn to\b" \
	-e "\bas we'?ll see below\b" \
	-e "\bit'?s worth noting( that)?\b" \
	-e "\bbefore we move on\b" \
	-e "\blet me explain\b" \
	-e "\bhere'?s the kicker\b" \
	-e "\bthe best part\??\b" \
	-e "\bhere'?s the breakdown\b" \
	-e "\bi'?m going to state this as clearly as possible\b" \
	-e "\bhere'?s the thing\b" \
	-e "\blet me be clear\b" \
	-e "\bhere'?s why this matters\b" \
	-e "\blet that sink in\b" \
	-e "\byou'?re not imagining( it)?\b" \
	-e "\byou'?re not alone\b" \
	-e "\byou'?re not broken\b" \
	-e "\band that'?s okay\b" \
	-e "\bgive yourself permission\b" \
	-e "\bit'?s not .{1,40} it'?s\b" \
	-e "\bthis isn'?t about\b" \
	-e "\bnot about .{1,30} about\b" \
	-e "\bweren'?t .{1,30} were\b" \
	-e "\bdidn'?t .{1,40} (they|it|we) \b" \
	-e "\bgame[- ]changing\b" \
	-e "\bparadigm shift\b" \
	-e "\bunprecedented\b" \
	-e "\btransformed forever\b" \
	-e "\bseismic shift\b" \
	-e "\bwatershed moment\b" \
	-e "\bfundamentally changed everything\b" \
	-e "\bnothing short of\b" \
	-e "\bsingle[- ]handedly\b" \
	-e "\bonce and for all\b" \
	-e "\breshap(e|ed|ing) the .{1,20} forever\b" \
	-e "\bchanged .{1,20} forever\b" \
	-e "\bthe future of .{1,20} is\b" \
	-e "\bthe future of .{1,20} looks\b" \
	-e "\bgap between\b" \
	"$tmp"
status=$?

if [ $status -eq 0 ]; then
	echo "Slop indicators found above"
	exit 1
elif [ $status -eq 1 ]; then
	echo "No slop indicators found"
	exit 0
else
	echo "Error: rg failed with exit code $status" >&2
	exit $status
fi
