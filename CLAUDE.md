# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Translation infrastructure for [KSeF 2.0 documentation](https://github.com/CIRFMF/ksef-docs) (Poland's National e-Invoice System). Original Polish docs live in `original/` (git submodule). Translations go to `translations/<lang>/`. A VitePress static site is deployed to GitHub Pages at https://flopsstuff.github.io/ksef-docs/.

## Commands

```bash
yarn check                                   # Verify the selected provider/key works (tiny test request)
yarn check --provider=openrouter             # Override provider/model for the check
yarn sync                                    # Pull upstream changes, update lock file
yarn status                                  # Show translation status (all languages)
yarn status --lang=ru                        # Status for one language
yarn translate --lang en --outdated          # Translate docs + OpenAPI spec
yarn translate:docs --lang en --outdated     # Translate only markdown docs
yarn translate:docs --lang ru auth/sesje.md  # Translate specific file
yarn translate:docs --lang en --all          # Retranslate all docs
yarn translate:openapi --lang=en             # Translate only OpenAPI spec
yarn translate:openapi --lang=ru --force     # Force retranslate OpenAPI spec
yarn docs:dev                                # Local dev server (prepare + vitepress dev)
yarn docs:build                              # Production build → site/.vitepress/dist/
```

All scripts run via `ts-node`. No separate build step needed.

## Architecture

### Translation Pipeline

1. `scripts/sync.ts` — runs `git submodule update --remote`, compares content hashes with `translation.lock.json`, reports new/outdated/deleted files
2. `scripts/translate.ts` — sends markdown files to the configured provider with system prompt from `prompts/translate.md`. Adds YAML frontmatter + translation banner. Updates lock file on completion
3. `scripts/translate-openapi.ts` — translates OpenAPI spec (`original/open-api.json`). Extracts `description`/`summary`/`title` fields, splits into ~10K char chunks, translates each chunk, merges back into full spec. Saves to `translations/<lang>/open-api.json`
4. `scripts/status.ts` — reads lock file and compares SHA256 hashes to show per-file status
5. `scripts/lib.ts` — shared constants (`ROOT`, `ORIGINAL_DIR`, `TRANSLATIONS_DIR`), lock file I/O, hash functions, file discovery, `formatError()`
6. `scripts/llm.ts` — provider abstraction: `Provider` type, `resolveModel()`, `createClient()`, and `streamComplete()` (unified completion over Anthropic/Bedrock Messages API and OpenRouter Chat Completions API). Always **streams** (keeps the socket alive on long generations — avoids `read ETIMEDOUT`) and uses **temperature 0**. Used by both translate scripts and `check-provider.ts`
7. `scripts/check-provider.ts` (`yarn check`) — sends a tiny request to verify the selected provider/key works; supports `--provider` / `--model`

### Site Build Pipeline

`scripts/build-site.ts` (runs as `docs:prepare`, automatically before `docs:dev`/`docs:build`):
- Copies `original/` → `site/pl/`, `translations/ru/` → `site/ru/`, `translations/en/` → `site/en/`
- Strips YAML frontmatter from translations (originals have none)
- Renames `README.md` → `index.md` for VitePress
- Copies images from `original/` into each `site/<lang>/` so relative paths work
- Runs `escapeVueConflicts()` to escape `<word>` patterns that Vue's template compiler would choke on (e.g., regex named groups like `(?<number>...)`)
- Runs `normalizeTableSpacing()` to ensure blank lines around markdown tables (upstream often glues a table directly under a heading), skipping code blocks

### VitePress Config (`site/.vitepress/config.mts`)

- `base: '/ksef-docs/'` for GitHub Pages
- 5 locales: `root` (landing page), `pl`, `ru`, `en`, `uk`
- Each locale has its own sidebar definition
- `ignoreDeadLinks: true` — some docs link to untranslated files or binary assets (XSD schemas)
- Must use `.mts` extension (ESM) because VitePress is ESM-only but the project tsconfig is CommonJS

## Key Conventions

- **Translation frontmatter**: Every translated file has YAML frontmatter (`original`, `source_repo`, `source_commit`, `last_translated`) and a `> **Translation.**` banner linking to the original. The build script strips these before site generation
- **File names stay Polish**: Internal links keep original file names (e.g., `[Session Management](auth/sesje.md)`). Only link text is translated
- **Lock file** (`translation.lock.json`): Tracks `sourceCommit` and per-file SHA256 hashes per language. Used to detect outdated translations
- **Generated dirs in .gitignore**: `site/pl/`, `site/ru/`, `site/en/`, `site/uk/`, `site/.vitepress/dist/`, `site/.vitepress/cache/`, `site/.vitepress/sidebars.json` are all generated and not committed
- **Secrets**: `.env` (API keys, gitignored) is the real config; `.env.example` is the committed template. A PreToolUse hook (`.claude/settings.json` → `.claude/hooks/deny-env-read.sh`) blocks reading `.env` from within Claude Code — read `.env.example` or run `yarn check` instead

## Environment Variables (`.env`)

Only needed for translation, not for site build:

| Variable | Default | Description |
|---|---|---|
| `TRANSLATION_PROVIDER` | `anthropic` | `anthropic`, `bedrock`, or `openrouter` |
| `ANTHROPIC_API_KEY` | — | Required when `TRANSLATION_PROVIDER=anthropic` |
| `OPENROUTER_API_KEY` | — | Required when `TRANSLATION_PROVIDER=openrouter` |
| `TRANSLATION_MODEL` | — | Generic model override for **any** provider (highest-priority env) |
| `ANTHROPIC_MODEL` / `BEDROCK_MODEL` / `OPENROUTER_MODEL` | — | Per-provider model override |
| `AWS_REGION` | `eu-central-1` | AWS region for Bedrock |
| `TRANSLATION_CONCURRENCY` | `2` | Max parallel translation requests |

Model resolution (`resolveModel` in `scripts/llm.ts`), first match wins: `--model` CLI flag → `TRANSLATION_MODEL` → provider-specific `*_MODEL` → built-in default per provider (`claude-sonnet-4-6` / `eu.anthropic.claude-sonnet-4-20250514-v1:0` / `anthropic/claude-sonnet-4.5`).

Bedrock uses standard AWS credential chain (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`). OpenRouter uses the OpenAI-compatible Chat Completions API (`https://openrouter.ai/api/v1`). Provider abstraction lives in `scripts/llm.ts` (model resolution, client creation, unified streaming completion). Verify a provider/key/model works with `yarn check` (optionally `yarn check --provider=openrouter --model=<id>`).

## Adding a New Language

1. Create `translations/<lang>/` and translate files (via `yarn translate:docs --lang <lang>` and `yarn translate:openapi --lang=<lang>`, or manually)
2. Add sidebar array and locale entry in `site/.vitepress/config.mts`
3. Add language button to `site/index.md`
4. Add `site/<lang>/` to `.gitignore`
5. Add `<lang>` to `ALL_LANGUAGES` in `scripts/build-site.ts`
