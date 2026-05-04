# Gumroad Marketing Materials

## What's here

```
gumroad/
├── README.md                  ← You are here
├── bundle-description.md      ← Full copy for the $10 bundle listing
├── setup-guide.md             ← Step-by-step Gumroad setup + launch checklist
├── assets/
│   └── thumbnail.html         ← Open in browser, screenshot for thumbnail
└── products/
    ├── run-llms.md
    ├── bugbash.md
    ├── agent-integration-testing.md
    ├── ideate.md
    ├── timeboxed-iterating.md
    ├── boost-modules.md
    ├── preact-buildless-frontend.md
    ├── turso-db.md
    ├── tinygrad.md
    └── pull-llamacpp-model.md
```

## Quick start

1. Log into Gumroad (Google Sign-in)
2. Follow `setup-guide.md` for step-by-step instructions
3. Copy descriptions from `bundle-description.md` and `products/*.md`
4. Open `assets/thumbnail.html` in browser → screenshot for thumbnail
5. Zip skills and upload

## File packaging commands

```bash
# Bundle
cd ~/code/skills && zip -r /tmp/agentic-skills-bundle.zip . -x ".git/*" "gumroad/*"

# Individual
for s in agent-integration-testing boost-modules bugbash ideate preact-buildless-frontend pull-llamacpp-model run-llms timeboxed-iterating tinygrad turso-db; do
  zip -r "/tmp/skill-${s}.zip" "$s/"
done
```
