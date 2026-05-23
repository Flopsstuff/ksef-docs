# KSeF Docs — Translations

**https://flopsstuff.github.io/ksef-docs/**

Translated documentation for [KSeF 2.0](https://github.com/CIRFMF/ksef-docs) (Poland's National e-Invoice System), with a static site powered by VitePress.

Available in Polish (original), Russian, English, and Ukrainian.

## 🙏 Help Keep Translations Running

This project translates the docs using LLMs, and **API credits are paid out of pocket**. Rate limits and token budgets are currently the main bottleneck for keeping all languages up to date.

**To put it in numbers:** catching up on the drift across two minor upstream releases (2.5 + 2.6) — re-translating the changed docs + OpenAPI spec for all languages — took roughly **1M input + 1M output tokens (~2M total)**, about **$18 on Claude Sonnet** (at $3/M input + $15/M output). A routine single-version sync is lighter, but upstream updates land regularly, so it adds up over time.

**If you can spare an API key or some tokens for this project, it would directly help.** It doesn't have to be much; even a small budget keeps the translations flowing.

It doesn't have to be Claude — **any AI provider works**: OpenAI, Google (Gemini), Anthropic, etc. An **[OpenRouter](https://openrouter.ai/) key is ideal**, since it gives access to many models through one key. Any amount is appreciated.

To contribute credits (or just say hi):

- 📧 Email **[flopspm@gmail.com](mailto:flopspm@gmail.com)**
- 🐛 Or open an [issue](https://github.com/flopsstuff/ksef-docs/issues) right here on the repo

Thank you! 💛

## Repo Structure

- `original/` — git submodule pointing to the upstream repo (CIRFMF/ksef-docs)
- `translations/ru/` — Russian translations
- `translations/en/` — English translations
- `translations/uk/` — Ukrainian translations
- `scripts/` — sync, translate, and build scripts
- `site/` — VitePress site (config, theme, landing page; content is generated)
- `prompts/` — system prompts for translation
- `translation.lock.json` — tracks which files are translated and from which source commit/hash

## Documentation Site

```bash
yarn install

# Local dev server with hot reload
yarn docs:dev

# Production build → site/.vitepress/dist/
yarn docs:build
```

The `docs:prepare` step copies originals and translations into `site/pl/`, `site/ru/`, `site/en/`, `site/uk/`, strips frontmatter, escapes Vue-incompatible HTML, normalizes table spacing, and copies images. It runs automatically before `docs:dev` and `docs:build`.

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## Automated Translation Updates

The `.github/workflows/update-translations.yml` workflow runs on Monday and Thursday at 08:00 UTC (and can be triggered manually). It syncs the upstream submodule, translates any outdated files for all languages, and pushes directly to `main`.

Requires a `ENV_FILE` repository secret containing the `.env` contents (API keys, provider config).

## Translation Workflow

```bash
# Check what changed in upstream
yarn sync

# Show translation status per language
yarn status

# Translate everything (docs + OpenAPI spec)
yarn translate --lang=all --outdated    # all languages at once
yarn translate --lang en --outdated     # single language

# Translate only markdown docs
yarn translate:docs --lang ru auth/sesje.md  # single file
yarn translate:docs --lang en --outdated     # all outdated
yarn translate:docs --lang ru --all          # everything from scratch

# Translate only OpenAPI spec
yarn translate:openapi --lang=en
yarn translate:openapi --lang=ru --force     # force retranslate
```

## How it works

1. The original Polish documentation lives in the `original/` submodule
2. `sync` pulls the latest upstream and detects new/changed/deleted files
3. `translate` sends files to the configured LLM provider (Anthropic, Bedrock, or OpenRouter) with a specialized prompt, preserving markdown structure, code examples, and API references
4. Each translated file gets YAML frontmatter with source commit, hash, and translation date
5. `translation.lock.json` tracks the state so we know what's up to date
6. `docs:build` assembles all languages into a VitePress static site with auto-generated sidebars

## Setup

```bash
git clone --recurse-submodules <this-repo>
yarn install
```

For translation (not needed for the site build), copy the example env file and fill in a key:

```bash
cp .env.example .env
```

[`.env.example`](.env.example) documents every variable — provider choice, API keys, model override, and concurrency. At minimum set `TRANSLATION_PROVIDER` and the matching key (`ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY`, or AWS credentials for Bedrock).

Verify your provider/key/model works before a big run:

```bash
yarn check                        # uses TRANSLATION_PROVIDER from .env
yarn check --provider=openrouter  # override provider
yarn check --model=openai/gpt-4o  # override model
```
