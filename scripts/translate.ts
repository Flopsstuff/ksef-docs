import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
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

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = "";
  let all = false;
  let outdated = false;
  const files: string[] = [];

  for (const arg of args) {
    if (arg === "--all") {
      all = true;
    } else if (arg === "--outdated") {
      outdated = true;
    } else if (arg.startsWith("--lang=")) {
      lang = arg.split("=")[1];
    } else if (arg === "--lang") {
      // handled by next iteration
    } else if (!arg.startsWith("--") && !lang && args[args.indexOf(arg) - 1] === "--lang") {
      lang = arg;
    } else if (!arg.startsWith("--")) {
      files.push(arg);
    }
  }

  if (!lang) {
    console.error("Usage: yarn translate --lang <lang> [--all | --outdated | file1 file2 ...]");
    process.exit(1);
  }

  return { lang, all, outdated, files };
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

async function translateFile(
  client: Anthropic,
  systemPrompt: string,
  lang: string,
  file: string,
  sourceCommit: string
): Promise<void> {
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

  console.log(`  Translating ${file} -> ${lang}...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const translatedContent =
    response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
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

  // Update lock
  const lock = readLock();
  if (!lock.languages[lang]) {
    lock.languages[lang] = {};
  }
  lock.languages[lang][file] = {
    sourceHash: sha256(originalContent),
    translatedAt: new Date().toISOString(),
  };
  lock.sourceCommit = sourceCommit;
  writeLock(lock);

  console.log(`  Done: translations/${lang}/${file}`);
}

async function main() {
  const { lang, all, outdated, files } = parseArgs();
  const toTranslate = getFilesToTranslate(lang, all, outdated, files);

  if (toTranslate.length === 0) {
    console.log("Nothing to translate. All files are up to date.");
    return;
  }

  console.log(`\nTranslating ${toTranslate.length} file(s) to ${lang}:\n`);
  for (const f of toTranslate) {
    console.log(`  ${f.status === "new" ? "+" : "~"} ${f.file}`);
  }
  console.log();

  // Load system prompt
  const systemPrompt = fs.readFileSync(path.join(PROMPTS_DIR, "translate.md"), "utf-8");

  const client = new Anthropic();
  const sourceCommit = getSubmoduleCommit();

  for (const f of toTranslate) {
    await translateFile(client, systemPrompt, lang, f.file, sourceCommit);
  }

  console.log(`\nAll done! ${toTranslate.length} file(s) translated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
