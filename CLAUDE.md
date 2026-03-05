# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Translation infrastructure for [KSeF 2.0 documentation](https://github.com/CIRFMF/ksef-docs) (Poland's National e-Invoice System). Original Polish docs live in `original/` (git submodule). Translations go to `translations/<lang>/`. A VitePress static site is deployed to GitHub Pages at https://flopsstuff.github.io/ksef-docs/.

## Commands

```bash
yarn sync                                    # Pull upstream changes, update lock file
yarn status                                  # Show translation status (all languages)
yarn status --lang=ru                        # Status for one language
yarn translate --lang en --outdated          # Translate new/changed files
yarn translate --lang ru auth/sesje.md       # Translate specific file
yarn translate --lang en --all               # Retranslate everything
yarn docs:dev                                # Local dev server (prepare + vitepress dev)
yarn docs:build                              # Production build → site/.vitepress/dist/
```

All scripts run via `ts-node`. No separate build step needed.

## Architecture

### Translation Pipeline

1. `scripts/sync.ts` — runs `git submodule update --remote`, compares content hashes with `translation.lock.json`, reports new/outdated/deleted files
2. `scripts/translate.ts` — sends files to Claude API (Anthropic or Bedrock) with system prompt from `prompts/translate.md`. Adds YAML frontmatter + translation banner. Updates lock file on completion
3. `scripts/status.ts` — reads lock file and compares SHA256 hashes to show per-file status
4. `scripts/lib.ts` — shared constants (`ROOT`, `ORIGINAL_DIR`, `TRANSLATIONS_DIR`), lock file I/O, hash functions, file discovery

### Site Build Pipeline

`scripts/build-site.ts` (runs as `docs:prepare`, automatically before `docs:dev`/`docs:build`):
- Copies `original/` → `site/pl/`, `translations/ru/` → `site/ru/`, `translations/en/` → `site/en/`
- Strips YAML frontmatter from translations (originals have none)
- Renames `README.md` → `index.md` for VitePress
- Copies images from `original/` into each `site/<lang>/` so relative paths work
- Runs `escapeVueConflicts()` to escape `<word>` patterns that Vue's template compiler would choke on (e.g., regex named groups like `(?<number>...)`)

### VitePress Config (`site/.vitepress/config.mts`)

- `base: '/ksef-docs/'` for GitHub Pages
- 4 locales: `root` (landing page), `pl`, `ru`, `en`
- Each locale has its own sidebar definition
- `ignoreDeadLinks: true` — some docs link to untranslated files or binary assets (XSD schemas)
- Must use `.mts` extension (ESM) because VitePress is ESM-only but the project tsconfig is CommonJS

## Key Conventions

- **Translation frontmatter**: Every translated file has YAML frontmatter (`original`, `source_repo`, `source_commit`, `last_translated`) and a `> **Translation.**` banner linking to the original. The build script strips these before site generation
- **File names stay Polish**: Internal links keep original file names (e.g., `[Session Management](auth/sesje.md)`). Only link text is translated
- **Lock file** (`translation.lock.json`): Tracks `sourceCommit` and per-file SHA256 hashes per language. Used to detect outdated translations
- **Generated dirs in .gitignore**: `site/pl/`, `site/ru/`, `site/en/`, `site/.vitepress/dist/`, `site/.vitepress/cache/` are all generated and not committed

## Environment Variables (`.env`)

Only needed for translation, not for site build:

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required when `TRANSLATION_PROVIDER=anthropic` |
| `TRANSLATION_PROVIDER` | `anthropic` | `anthropic` or `bedrock` |
| `AWS_REGION` | `eu-central-1` | AWS region for Bedrock |
| `TRANSLATION_CONCURRENCY` | `5` | Max parallel translation requests |

Bedrock uses standard AWS credential chain (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`).

## Adding a New Language

1. Create `translations/<lang>/` and translate files (via `yarn translate --lang <lang>` or manually)
2. Add sidebar array and locale entry in `site/.vitepress/config.mts`
3. Add language button to `site/index.md`
4. Add `site/<lang>/` to `.gitignore`
5. Add `<lang>` to `ALL_LANGUAGES` in `scripts/build-site.ts`
