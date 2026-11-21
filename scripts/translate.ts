import dotenv from "dotenv";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import {
  ROOT,
  ORIGINAL_DIR,
  TRANSLATIONS_DIR,
  readLock,
  writeLock,
  getSubmoduleCommit,
  sha256,
  getFileStatuses,
  formatError,
  FileInfo,
} from "./lib";
import { Provider, PROVIDERS, resolveModelChain, createClient, streamComplete, IncompleteOutputError } from "./llm";
import { checkTranslation, stripBanner, stripWrapperTags } from "./validate";
import { planSections, makeBatches, norm } from "./sections";

// Make .env authoritative: override variables already present in the shell
// environment (e.g. an ANTHROPIC_API_KEY exported in the user's profile).
dotenv.config({ override: true });

const PROMPTS_DIR = path.join(ROOT, "prompts");

const LANG_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
  uk: "Ukrainian",
};

const DEFAULT_CONCURRENCY = 2;

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = "";
  let all = false;
  let outdated = false;
  let concurrency = parseInt(process.env.TRANSLATION_CONCURRENCY || "", 10) || DEFAULT_CONCURRENCY;
  let provider: Provider = (process.env.TRANSLATION_PROVIDER as Provider) || "anthropic";
  const files: string[] = [];

  for (const arg of args) {
    if (arg === "--all") {
      all = true;
    } else if (arg === "--outdated") {
      outdated = true;
    } else if (arg.startsWith("--lang=")) {
      lang = arg.split("=")[1];
    } else if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--provider=")) {
      provider = arg.split("=")[1] as Provider;
    } else if (arg === "--lang") {
      // handled by next iteration
    } else if (!arg.startsWith("--") && !lang && args[args.indexOf(arg) - 1] === "--lang") {
      lang = arg;
    } else if (!arg.startsWith("--")) {
      files.push(arg);
    }
  }

  if (!lang) {
    console.error("Usage: yarn translate --lang <lang> [--all | --outdated | file1 file2 ...] [--concurrency=N] [--provider=anthropic|bedrock|openrouter]");
    process.exit(1);
  }

  if (!PROVIDERS.includes(provider)) {
    console.error(`Unknown provider "${provider}". Valid: ${PROVIDERS.join(", ")}`);
    process.exit(1);
  }

  return { lang, all, outdated, files, concurrency, provider };
}

function getFilesToTranslate(lang: string, all: boolean, outdated: boolean, files: string[]): FileInfo[] {
  const statuses = getFileStatuses(lang);

  if (files.length > 0) {
    return statuses.filter((s) => files.includes(s.file));
  }

  if (all) {
    return statuses.filter((s) => s.status !== "deleted");
  }

  if (outdated) {
    return statuses.filter((s) => s.status === "outdated" || s.status === "new");
  }

  // Default: outdated + new
  return statuses.filter((s) => s.status === "outdated" || s.status === "new");
}

/**
 * Files at least this large (or api-changelog.md) are translated section by
 * section in batches instead of in one request: a whole-file reply would not fit
 * the output-token limit (a ~85 KB changelog needs far more than 16K tokens),
 * and unchanged sections can be reused verbatim instead of being re-generated.
 */
const SECTIONED_MIN_BYTES = 24 * 1024;
/** Max source size of one batch of sections sent in a single request. */
const BATCH_MAX_BYTES = 12 * 1024;
const MAX_TOKENS = 16000;

const toLF = (s: string) => s.replace(/\r\n?/g, "\n");

function readSourceCommit(translationPath: string): string | null {
  const raw = fs.readFileSync(translationPath, "utf-8");
  const m = raw.match(/^source_commit:\s*["']?([0-9a-f]{7,40})["']?\s*$/m);
  return m ? m[1] : null;
}

/** The original file as it was at `commit` (what the existing translation was made from). */
function originalAt(commit: string, file: string): string | null {
  try {
    return toLF(
      execFileSync("git", ["-C", ORIGINAL_DIR, "show", `${commit}:${file}`], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  } catch {
    return null;
  }
}


async function translateSectioned(
  ctx: TranslateCtx,
  file: string,
  originalContent: string,
  existingTranslation: string,
  translationPath: string,
): Promise<string> {
  const { lang, langName } = ctx;
  const commit = existingTranslation ? readSourceCommit(translationPath) : null;
  const oldContent = commit ? originalAt(commit, file) : null;
  if (existingTranslation && !oldContent) {
    console.warn(`  ⚠️ ${file} -> ${lang}: original at source_commit ${commit ?? "?"} not found; translating all sections`);
  }
  const { sections, result, refFor } = planSections(originalContent, oldContent, existingTranslation);
  const batches = makeBatches(sections, result, BATCH_MAX_BYTES);

  const reused = sections.filter((s, i) => norm(s.text) && result[i] !== undefined).length;
  const todo = batches.reduce((n, b) => n + b.length, 0);
  console.log(`  Translating ${file} -> ${lang} by sections: ${todo} to translate in ${batches.length} batch(es), ${reused} reused...`);

  for (let b = 0; b < batches.length; b++) {
    const idx = batches[b];
    const source = idx.map((i) => norm(sections[i].text)).join("\n\n");
    const refs = idx.map(refFor).filter((t): t is string => !!t);
    let userMessage =
      `Translate the following markdown fragment from Polish to ${langName}. ` +
      `It is a consecutive part of a longer document; translate all of it, keeping every heading and code block.\n\n` +
      `File: ${file}\n\n<original>\n${source}\n</original>`;
    if (refs.length > 0) {
      userMessage += `\n\nHere is the previous translation of these sections for reference (update it to match the current original):\n\n<previous_translation>\n${refs.map(norm).join("\n\n")}\n</previous_translation>`;
    }
    const kb = (Buffer.byteLength(source, "utf-8") / 1024).toFixed(1);
    console.log(`    batch ${b + 1}/${batches.length}: ${idx.length} section(s), ${kb} KB`);
    const { text } = await streamComplete({
      client: ctx.client, provider: ctx.provider, model: ctx.model, system: ctx.systemPrompt,
      userContent: userMessage, maxTokens: MAX_TOKENS, onFallback: ctx.onFallback(file),
      validate: (t) => checkTranslation(source, stripWrapperTags(t)).join("; ") || null,
    });
    // The batch is stored on its first section; the rest are covered by it.
    idx.forEach((i, j) => (result[i] = j === 0 ? stripWrapperTags(text) : ""));
  }

  return result.map((t) => norm(t!)).filter(Boolean).join("\n\n") + "\n";
}

interface TranslateResult {
  file: string;
  sourceHash: string;
  translatedAt: string;
}

interface TranslateCtx {
  client: any;
  provider: Provider;
  model: string | string[];
  systemPrompt: string;
  lang: string;
  langName: string;
  sourceCommit: string;
  onFallback: (file: string) => (failed: string, next: string, error: string) => void;
}

async function translateFile(ctx: TranslateCtx, file: string): Promise<TranslateResult> {
  const { lang, langName } = ctx;
  const originalPath = path.join(ORIGINAL_DIR, file);
  const translationPath = path.join(TRANSLATIONS_DIR, lang, file);
  // The lock hashes the raw bytes; translation works on LF text (some upstream
  // files use CRLF, translations are LF).
  const rawOriginal = fs.readFileSync(originalPath, "utf-8");
  const originalContent = toLF(rawOriginal);

  let existingTranslation = "";
  if (fs.existsSync(translationPath)) {
    existingTranslation = stripBanner(matter(fs.readFileSync(translationPath, "utf-8")).content);
  }

  const bytes = Buffer.byteLength(originalContent, "utf-8");
  let translatedContent: string | undefined;

  if (file !== "api-changelog.md" && bytes < SECTIONED_MIN_BYTES) {
    let userMessage = `Translate the following document from Polish to ${langName}.\n\nFile: ${file}\n\n<original>\n${originalContent}\n</original>`;
    if (existingTranslation) {
      userMessage += `\n\nHere is the previous translation for reference (update it to match the current original):\n\n<previous_translation>\n${existingTranslation}\n</previous_translation>`;
    }
    const lines = originalContent.split("\n").length;
    console.log(`  Translating ${file} -> ${lang} (${lines} lines, ${(bytes / 1024).toFixed(1)} KB)...`);
    try {
      const { text } = await streamComplete({
        client: ctx.client, provider: ctx.provider, model: ctx.model, system: ctx.systemPrompt,
        userContent: userMessage, maxTokens: MAX_TOKENS, onFallback: ctx.onFallback(file),
        validate: (t) => checkTranslation(originalContent, stripWrapperTags(t)).join("; ") || null,
      });
      translatedContent = stripWrapperTags(text) + "\n";
    } catch (err) {
      if (!(err instanceof IncompleteOutputError)) throw err;
      console.warn(`  ⚠️ ${file} -> ${lang}: whole-file translation incomplete (${err.message}); retrying by sections`);
    }
  }

  if (translatedContent === undefined) {
    translatedContent = await translateSectioned(ctx, file, originalContent, existingTranslation, translationPath);
  }

  // Last line of defence: never write (or lock) a translation that is not
  // structurally complete — the file stays outdated and is retried next run.
  const problems = checkTranslation(originalContent, translatedContent);
  if (problems.length > 0) {
    throw new Error(`translation rejected as incomplete: ${problems.join("; ")}`);
  }

  return writeTranslation(translationPath, file, ctx.sourceCommit, translatedContent, rawOriginal);
}

function writeTranslation(
  translationPath: string,
  file: string,
  sourceCommit: string,
  translatedContent: string,
  originalContent: string,
): TranslateResult {
  const shortCommit = sourceCommit.slice(0, 7);
  const today = new Date().toISOString().split("T")[0];
  const sourceUrl = `https://github.com/CIRFMF/ksef-docs/blob/main/${file}`;

  const output =
    `---\n` +
    `original: ${file}\n` +
    `source_repo: https://github.com/CIRFMF/ksef-docs\n` +
    `source_commit: ${shortCommit}\n` +
    `last_translated: ${today}\n` +
    `---\n\n` +
    `> **Translation.** Original: [${file}](${sourceUrl})\n\n` +
    translatedContent;

  fs.mkdirSync(path.dirname(translationPath), { recursive: true });
  fs.writeFileSync(translationPath, output);

  const lang = path.relative(path.join(ROOT, "translations"), path.dirname(translationPath)).split(path.sep)[0];
  console.log(`  Done: translations/${lang}/${file}`);

  return {
    file,
    sourceHash: sha256(originalContent),
    translatedAt: new Date().toISOString(),
  };
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
}

async function main() {
  const { lang, all, outdated, files, concurrency, provider } = parseArgs();
  const toTranslate = getFilesToTranslate(lang, all, outdated, files);

  if (toTranslate.length === 0) {
    console.log("Nothing to translate. All files are up to date.");
    return;
  }

  const modelChain = resolveModelChain(provider);
  const modelLabel = modelChain.length > 1 ? `${modelChain[0]} (fallbacks: ${modelChain.slice(1).join(", ")})` : modelChain[0];
  console.log(`\nTranslating ${toTranslate.length} file(s) to ${lang} (provider: ${provider}, model: ${modelLabel}, concurrency: ${concurrency}):\n`);
  for (const f of toTranslate) {
    console.log(`  ${f.status === "new" ? "+" : "~"} ${f.file}`);
  }
  console.log();

  // Load system prompt
  const systemPrompt = fs.readFileSync(path.join(PROMPTS_DIR, "translate.md"), "utf-8");

  const client = createClient(provider);
  const model = modelChain;
  const sourceCommit = getSubmoduleCommit();

  const ctx: TranslateCtx = {
    client, provider, model, systemPrompt, lang, langName: LANG_NAMES[lang] || lang, sourceCommit,
    onFallback: (file) => (failed, next, error) =>
      console.warn(`  ⚠️ ${file} -> ${lang}: ${failed} failed (${error}); trying ${next}`),
  };

  const results: TranslateResult[] = [];
  let failed = 0;

  await runPool(toTranslate, concurrency, async (f) => {
    try {
      const result = await translateFile(ctx, f.file);
      results.push(result);
    } catch (err: any) {
      failed++;
      console.error(`  FAILED: ${f.file} — ${formatError(err)}`);
    }
  });

  // Update lock file once at the end
  if (results.length > 0) {
    const lock = readLock();
    if (!lock.languages[lang]) {
      lock.languages[lang] = {};
    }
    for (const r of results) {
      lock.languages[lang][r.file] = {
        sourceHash: r.sourceHash,
        translatedAt: r.translatedAt,
      };
    }
    lock.sourceCommit = sourceCommit;
    writeLock(lock);
  }

  console.log(`\nDone! ${results.length} translated, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
