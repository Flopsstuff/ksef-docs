# KSeF Docs — Translations

**https://flopsstuff.github.io/ksef-docs/**

Translated documentation for [KSeF 2.0](https://github.com/CIRFMF/ksef-docs) (Poland's National e-Invoice System), with a static site powered by VitePress.

Available in Polish (original), Russian, and English.

## Repo Structure

- `original/` — git submodule pointing to the upstream repo (CIRFMF/ksef-docs)
- `translations/ru/` — Russian translations
- `translations/en/` — English translations
- `scripts/` — sync, translate, and build scripts
- `site/` — VitePress site (config, theme, landing page; content is generated)
- `prompts/` — system prompt for Claude API translation
- `translation.lock.json` — tracks which files are translated and from which source commit/hash

## Documentation Site

```bash
yarn install

# Local dev server with hot reload
yarn docs:dev

# Production build → site/.vitepress/dist/
yarn docs:build
```

The `docs:prepare` step copies originals and translations into `site/pl/`, `site/ru/`, `site/en/`, strips frontmatter, escapes Vue-incompatible HTML, and copies images. It runs automatically before `docs:dev` and `docs:build`.

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## Translation Workflow

```bash
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
6. `docs:build` assembles all languages into a VitePress static site with auto-generated sidebars

## Setup

```bash
git clone --recurse-submodules <this-repo>
yarn install
```

Create a `.env` file for translation (not needed for site build):

```bash
# Anthropic API key (required for provider=anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Translation provider: "anthropic" (default) or "bedrock"
TRANSLATION_PROVIDER=anthropic

# AWS region for Bedrock provider (default: eu-central-1)
# Bedrock auth uses standard AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS_PROFILE)
AWS_REGION=eu-central-1

# Max parallel translation requests (default: 5)
TRANSLATION_CONCURRENCY=5
```
