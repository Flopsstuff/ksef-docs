import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import * as fs from "fs";
import * as path from "path";
import {
  ROOT,
  ORIGINAL_DIR,
  TRANSLATIONS_DIR,
  readLock,
  writeLock,
  getSubmoduleCommit,
  sha256,
} from "./lib";

const PROMPTS_DIR = path.join(ROOT, "prompts");

const LANG_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
  uk: "Ukrainian",
};

const DEFAULT_CONCURRENCY = 5;
const CHUNK_CHAR_LIMIT = 10_000;

type Provider = "anthropic" | "bedrock";

const MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  bedrock: "eu.anthropic.claude-sonnet-4-20250514-v1:0",
};

interface TextField {
  path: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Extract / merge translatable fields
// ---------------------------------------------------------------------------

// Paths where "name" field should be translated (tag/group labels, not parameter names)
const TRANSLATABLE_NAME_PREFIXES = ["tags[", "x-tagGroups["];

function isTranslatableName(path: string): boolean {
  return TRANSLATABLE_NAME_PREFIXES.some((p) => path.startsWith(p) && path.endsWith(".name"));
}

function extractFields(obj: any, prefix: string, out: TextField[]): void {
  if (obj === null || obj === undefined || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => extractFields(item, `${prefix}[${i}]`, out));
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      if (
        key === "description" || key === "summary" || key === "title" ||
        (key === "name" && isTranslatableName(currentPath))
      ) {
        out.push({ path: currentPath, text: value });
      }
    }
    if (typeof value === "object") {
      extractFields(value, currentPath, out);
    }
  }
}

function setByPath(obj: any, dotPath: string, value: string): void {
  const segments: (string | number)[] = [];
  // Parse path like "paths./auth/sessions.get.parameters[0].description"
  for (const part of dotPath.split(".")) {
    const match = part.match(/^(.+?)\[(\d+)\]$/);
    if (match) {
      segments.push(match[1], parseInt(match[2], 10));
    } else {
      segments.push(part);
    }
  }

  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    current = current[segments[i]];
    if (current === undefined) return;
  }
  current[segments[segments.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

function chunkFields(fields: TextField[]): TextField[][] {
  const chunks: TextField[][] = [];
  let current: TextField[] = [];
  let currentSize = 0;

  for (const field of fields) {
    if (currentSize + field.text.length > CHUNK_CHAR_LIMIT && current.length > 0) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(field);
    currentSize += field.text.length;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

function createClient(provider: Provider): Anthropic | AnthropicBedrock {
  if (provider === "bedrock") {
    return new AnthropicBedrock({
      awsRegion: process.env.AWS_REGION || "eu-central-1",
    });
  }
  return new Anthropic();
}

async function translateChunk(
  client: any,
  model: string,
  systemPrompt: string,
  lang: string,
  chunk: TextField[],
  chunkIndex: number,
  totalChunks: number,
): Promise<string[]> {
  const langName = LANG_NAMES[lang] || lang;
  const totalChars = chunk.reduce((s, f) => s + f.text.length, 0);

  console.log(
    `  Chunk ${chunkIndex + 1}/${totalChunks}: ${chunk.length} fields, ${totalChars} chars`,
  );

  const input = JSON.stringify(
    chunk.map((f) => ({ path: f.path, text: f.text })),
  );

  const response = await client.messages.create(
    {
      model,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Translate the following fields from Polish to ${langName}.\n\n${input}`,
        },
      ],
    },
    { timeout: 300_000 },
  );

  const raw = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  // Parse the response — expect a JSON array of strings
  const cleaned = raw.replace(/^```json?\s*/m, "").replace(/```\s*$/m, "").trim();
  let translated: string[];
  try {
    translated = JSON.parse(cleaned);
  } catch {
    console.error(`  Failed to parse chunk ${chunkIndex + 1} response. Raw output:`);
    console.error(raw.slice(0, 500));
    throw new Error(`Invalid JSON response for chunk ${chunkIndex + 1}`);
  }

  if (translated.length !== chunk.length) {
    throw new Error(
      `Chunk ${chunkIndex + 1}: expected ${chunk.length} translations, got ${translated.length}`,
    );
  }

  return translated;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = "";
  let provider: Provider =
    (process.env.TRANSLATION_PROVIDER as Provider) || "anthropic";
  let concurrency =
    parseInt(process.env.TRANSLATION_CONCURRENCY || "", 10) || DEFAULT_CONCURRENCY;
  let force = false;

  for (const arg of args) {
    if (arg.startsWith("--lang=")) {
      lang = arg.split("=")[1];
    } else if (arg.startsWith("--provider=")) {
      provider = arg.split("=")[1] as Provider;
    } else if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--force") {
      force = true;
    }
  }

  if (!lang) {
    console.error(
      "Usage: yarn translate:openapi --lang=<lang> [--force] [--concurrency=N] [--provider=anthropic|bedrock]",
    );
    process.exit(1);
  }

  return { lang, provider, concurrency, force };
}

async function main() {
  const { lang, provider, concurrency, force } = parseArgs();

  const specPath = path.join(ORIGINAL_DIR, "open-api.json");
  if (!fs.existsSync(specPath)) {
    console.error("OpenAPI spec not found at", specPath);
    process.exit(1);
  }

  const specContent = fs.readFileSync(specPath, "utf-8");
  const sourceHash = sha256(specContent);

  // Check if already up to date
  const lock = readLock();
  const lockEntry = lock.languages[lang]?.["open-api.json"];
  if (!force && lockEntry && lockEntry.sourceHash === sourceHash) {
    console.log(`open-api.json translation for ${lang} is up to date. Use --force to retranslate.`);
    return;
  }

  const spec = JSON.parse(specContent);

  // Extract translatable fields
  const fields: TextField[] = [];
  extractFields(spec, "", fields);
  console.log(`Extracted ${fields.length} translatable fields (${fields.reduce((s, f) => s + f.text.length, 0)} chars)`);

  // Chunk
  const chunks = chunkFields(fields);
  console.log(`Split into ${chunks.length} chunks (~${CHUNK_CHAR_LIMIT} chars each)`);
  console.log(`Translating to ${lang} (provider: ${provider}, concurrency: ${concurrency})\n`);

  const systemPrompt = fs.readFileSync(
    path.join(PROMPTS_DIR, "translate-openapi.md"),
    "utf-8",
  );
  const client = createClient(provider);
  const model = MODELS[provider];

  // Translate chunks with concurrency pool
  const allTranslations: (string[] | null)[] = new Array(chunks.length).fill(null);
  let failed = 0;
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < chunks.length) {
      const i = nextIndex++;
      try {
        allTranslations[i] = await translateChunk(
          client, model, systemPrompt, lang, chunks[i], i, chunks.length,
        );
      } catch (err: any) {
        failed++;
        console.error(`  FAILED chunk ${i + 1}: ${err.message}`);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    () => worker(),
  );
  await Promise.all(workers);

  if (failed > 0) {
    console.error(`\n${failed} chunk(s) failed. Aborting — no output written.`);
    process.exit(1);
  }

  // Merge translations back into spec
  const translatedSpec = JSON.parse(specContent); // fresh copy
  let fieldIdx = 0;
  for (let ci = 0; ci < chunks.length; ci++) {
    const translations = allTranslations[ci]!;
    for (let ti = 0; ti < translations.length; ti++) {
      setByPath(translatedSpec, chunks[ci][ti].path, translations[ti]);
      fieldIdx++;
    }
  }

  // Update tag name references throughout the spec
  // tags[].name is used as reference in paths.*.*.tags[] and x-tagGroups[].tags[]
  const originalSpec = JSON.parse(specContent);
  if (originalSpec.tags && translatedSpec.tags) {
    const tagNameMap: Record<string, string> = {};
    for (let i = 0; i < originalSpec.tags.length; i++) {
      const oldName = originalSpec.tags[i].name;
      const newName = translatedSpec.tags[i].name;
      if (oldName !== newName) {
        tagNameMap[oldName] = newName;
      }
    }

    if (Object.keys(tagNameMap).length > 0) {
      // Update paths.*.*.tags[]
      for (const pathObj of Object.values(translatedSpec.paths || {})) {
        for (const op of Object.values(pathObj as any)) {
          if (op && typeof op === "object" && Array.isArray((op as any).tags)) {
            (op as any).tags = (op as any).tags.map(
              (t: string) => tagNameMap[t] || t,
            );
          }
        }
      }
      // Update x-tagGroups[].tags[]
      for (const group of translatedSpec["x-tagGroups"] || []) {
        if (Array.isArray(group.tags)) {
          group.tags = group.tags.map((t: string) => tagNameMap[t] || t);
        }
      }
      console.log(`Updated ${Object.keys(tagNameMap).length} tag name references`);
    }
  }

  // Write translated spec
  const outDir = path.join(TRANSLATIONS_DIR, lang);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "open-api.json");
  fs.writeFileSync(outPath, JSON.stringify(translatedSpec, null, 2) + "\n");
  console.log(`\nWritten: translations/${lang}/open-api.json`);

  // Update lock file
  if (!lock.languages[lang]) {
    lock.languages[lang] = {};
  }
  lock.languages[lang]["open-api.json"] = {
    sourceHash,
    translatedAt: new Date().toISOString(),
  };
  lock.sourceCommit = getSubmoduleCommit();
  writeLock(lock);
  console.log("Updated translation.lock.json");

  console.log(`\nDone! ${fieldIdx} fields translated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
