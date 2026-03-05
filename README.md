# KSeF Docs — Translations

Automated translation infrastructure for [KSeF 2.0 documentation](https://github.com/CIRFMF/ksef-docs) (originally in Polish).

## Structure

- `original/` — git submodule pointing to the upstream repo (CIRFMF/ksef-docs)
- `translations/ru/` — Russian translations
- `translations/en/` — English translations
- `scripts/` — sync, translate, and status scripts
- `prompts/` — system prompt for Claude API translation
- `translation.lock.json` — tracks which files are translated and from which source commit/hash

## Usage

```bash
yarn install

# Check what changed in upstream
yarn sync

# Show translation status per language
yarn status

# Translate files
yarn translate --lang ru auth/sesje.md       # single file
yarn translate --lang en --outdated          # all outdated
yarn translate --lang ru --all               # everything from scratch
```

## How it works

1. The original Polish documentation lives in the `original/` submodule
2. `sync` pulls the latest upstream and detects new/changed/deleted files
3. `translate` sends files to Claude API with a specialized prompt, preserving markdown structure, code examples, and API references
4. Each translated file gets YAML frontmatter with source commit, hash, and translation date
5. `translation.lock.json` tracks the state so we know what's up to date

## Setup

```bash
git clone --recurse-submodules <this-repo>
yarn install
```

Set `ANTHROPIC_API_KEY` in `.env`.
