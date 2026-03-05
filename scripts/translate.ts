import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
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
  FileInfo,
} from "./lib";

const PROMPTS_DIR = path.join(ROOT, "prompts");

const LANG_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
};

const DEFAULT_CONCURRENCY = 5;

type Provider = "anthropic" | "bedrock";

const MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  bedrock: "eu.anthropic.claude-sonnet-4-20250514-v1:0",
};

function createClient(provider: Provider): Anthropic | AnthropicBedrock {
  if (provider === "bedrock") {
    return new AnthropicBedrock({
      awsRegion: process.env.AWS_REGION || "eu-central-1",
    });
  }
  return new Anthropic();
}

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = "";
  let all = false;
  let outdated = false;
  let concurrency = DEFAULT_CONCURRENCY;
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
    console.error("Usage: yarn translate --lang <lang> [--all | --outdated | file1 file2 ...] [--concurrency=N] [--provider=anthropic|bedrock]");
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

interface TranslateResult {
  file: string;
  sourceHash: string;
  translatedAt: string;
}

async function translateFile(
  client: any,
  model: string,
  systemPrompt: string,
  lang: string,
  file: string,
  sourceCommit: string
): Promise<TranslateResult> {
  const originalPath = path.join(ORIGINAL_DIR, file);
  const translationPath = path.join(TRANSLATIONS_DIR, lang, file);
  const originalContent = fs.readFileSync(originalPath, "utf-8");

  let existingTranslation = "";
  if (fs.existsSync(translationPath)) {
    const parsed = matter(fs.readFileSync(translationPath, "utf-8"));
    existingTranslation = parsed.content;
  }

  const langName = LANG_NAMES[lang] || lang;
  let userMessage = `Translate the following document from Polish to ${langName}.\n\nFile: ${file}\n\n<original>\n${originalContent}\n</original>`;

  if (existingTranslation) {
    userMessage += `\n\nHere is the previous translation for reference (update it to match the current original):\n\n<previous_translation>\n${existingTranslation}\n</previous_translation>`;
  }

  const lines = originalContent.split("\n").length;
  const kb = (Buffer.byteLength(originalContent, "utf-8") / 1024).toFixed(1);
  console.log(`  Translating ${file} -> ${lang} (${lines} lines, ${kb} KB)...`);

  const response = await client.messages.create(
    {
      model,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    },
    { timeout: 300_000 },
  );

  const translatedContent =
    response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("") + "\n";

  // Build frontmatter
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

  // Ensure directory exists
  fs.mkdirSync(path.dirname(translationPath), { recursive: true });
  fs.writeFileSync(translationPath, output);

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

  console.log(`\nTranslating ${toTranslate.length} file(s) to ${lang} (provider: ${provider}, concurrency: ${concurrency}):\n`);
  for (const f of toTranslate) {
    console.log(`  ${f.status === "new" ? "+" : "~"} ${f.file}`);
  }
  console.log();

  // Load system prompt
  const systemPrompt = fs.readFileSync(path.join(PROMPTS_DIR, "translate.md"), "utf-8");

  const client = createClient(provider);
  const model = MODELS[provider];
  const sourceCommit = getSubmoduleCommit();

  const results: TranslateResult[] = [];
  let failed = 0;

  await runPool(toTranslate, concurrency, async (f) => {
    try {
      const result = await translateFile(client, model, systemPrompt, lang, f.file, sourceCommit);
      results.push(result);
    } catch (err: any) {
      failed++;
      console.error(`  FAILED: ${f.file} — ${err.message}`);
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
