import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  ROOT,
  ORIGINAL_DIR,
  TRANSLATIONS_DIR,
  TRANSLATED_LANGUAGES,
  readLock,
  writeLock,
  getSubmoduleCommit,
  sha256,
  formatError,
} from "./lib";
import { Provider, PROVIDERS, resolveModelChain, createClient, streamComplete } from "./llm";
import { dedupeByText, tmKey, loadTM, saveTM, TextField } from "./tm";

// Make .env authoritative: override variables already present in the shell
// environment (e.g. an ANTHROPIC_API_KEY exported in the user's profile).
dotenv.config({ override: true });

const PROMPTS_DIR = path.join(ROOT, "prompts");

const LANG_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
  uk: "Ukrainian",
};

const DEFAULT_CONCURRENCY = 5;
const CHUNK_CHAR_LIMIT = 3_000;

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

async function translateChunk(
  client: any,
  provider: Provider,
  model: string | string[],
  systemPrompt: string,
  lang: string,
  chunk: TextField[],
  chunkIndex: number,
  totalChunks: number,
): Promise<{ translations: string[]; model: string }> {
  const langName = LANG_NAMES[lang] || lang;
  const totalChars = chunk.reduce((s, f) => s + f.text.length, 0);

  console.log(
    `  Chunk ${chunkIndex + 1}/${totalChunks}: ${chunk.length} fields, ${totalChars} chars`,
  );

  // Marker protocol instead of a JSON array: each field is wrapped in a marker line,
  // and the translation is whatever sits between its marker and the next. JSON arrays
  // of multi-line markdown (tables with pipes/quotes/newlines) make models mis-escape
  // and emit invalid JSON; markers have nothing to escape, so this is robust.
  const input = chunk.map((f, i) => `${FIELD_MARKER(i + 1)}\n${f.text}`).join("\n");

  const { text: raw, model: usedModel } = await streamComplete({
    client,
    provider,
    model,
    system: systemPrompt,
    userContent:
      `Translate the ${chunk.length} fields below from Polish to ${langName}. ` +
      `Reproduce every marker line exactly and put each field's translation between its marker and the next.\n\n${input}`,
    maxTokens: Math.min(16_000, Math.max(8_000, totalChars * 3)),
    onFallback: (failed, next, error) =>
      console.warn(`    ⚠️ chunk ${chunkIndex + 1}/${totalChunks}: ${failed} failed (${error}); trying ${next}`),
  });

  const translations = parseMarkedResponse(raw, chunk.length);
  if (!translations) {
    console.error(`  Failed to parse chunk ${chunkIndex + 1} response. Raw output:`);
    console.error(raw.slice(0, 500));
    throw new Error(`Marker mismatch for chunk ${chunkIndex + 1}`);
  }

  return { translations, model: usedModel };
}

// Field marker for the translation transport. Distinctive enough to never collide
// with real OpenAPI prose, fixed byte-for-byte so the model can echo it.
const FIELD_MARKER = (i: number) => `[[[KSEF-FIELD::${i}]]]`;
const FIELD_MARKER_RE = /\[\[\[KSEF-FIELD::(\d+)\]\]\]/g;

// Parse a marker-delimited response into exactly `n` translations (in order). Returns
// null on any mismatch (wrong count, out-of-order, or missing markers) so the caller
// can retry / fall back. Text before the first marker (stray prose) is ignored.
function parseMarkedResponse(raw: string, n: number): string[] | null {
  const cleaned = raw.replace(/^```[a-z]*\s*/im, "").replace(/```\s*$/m, "");
  const marks: { n: number; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  FIELD_MARKER_RE.lastIndex = 0;
  while ((m = FIELD_MARKER_RE.exec(cleaned)) !== null) {
    marks.push({ n: parseInt(m[1], 10), start: m.index, end: FIELD_MARKER_RE.lastIndex });
  }
  if (marks.length !== n || marks.some((mk, i) => mk.n !== i + 1)) return null;

  const out: string[] = [];
  for (let i = 0; i < marks.length; i++) {
    const textStart = marks[i].end;
    const textEnd = i + 1 < marks.length ? marks[i + 1].start : cleaned.length;
    // Drop the single newline right after the marker and any trailing whitespace.
    const seg = cleaned.slice(textStart, textEnd).replace(/^\r?\n/, "").replace(/\s+$/, "");
    if (seg.length === 0) return null; // empty segment — sources are never empty here
    out.push(seg);
  }
  return out;
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
  // Selective re-translation: invalidate a subset of TM entries so only they are
  // re-done (everything else stays reused). Selectors compose (OR).
  let retranslateModel = ""; // entries whose per-entry model == this id
  let retranslateMatching = ""; // entries whose current translation matches this regex
  const retranslateKeys: string[] = []; // explicit sha256(text) entry keys

  for (const arg of args) {
    if (arg.startsWith("--lang=")) {
      lang = arg.split("=")[1];
    } else if (arg.startsWith("--provider=")) {
      provider = arg.split("=")[1] as Provider;
    } else if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--force") {
      force = true;
    } else if (arg.startsWith("--retranslate-model=")) {
      retranslateModel = arg.slice("--retranslate-model=".length);
    } else if (arg.startsWith("--retranslate-matching=")) {
      retranslateMatching = arg.slice("--retranslate-matching=".length);
    } else if (arg.startsWith("--retranslate-key=")) {
      for (const k of arg.slice("--retranslate-key=".length).split(",")) {
        const t = k.trim();
        if (t) retranslateKeys.push(t);
      }
    }
  }

  if (!lang) {
    console.error(
      `Usage: yarn translate:openapi --lang=<${TRANSLATED_LANGUAGES.join("|")}> [--force] [--concurrency=N] [--provider=anthropic|bedrock|openrouter]\n` +
        "  Selective re-translation (compose, OR): --retranslate-model=<id> --retranslate-matching=<regex> --retranslate-key=<sha256[,sha256...]>",
    );
    process.exit(1);
  }

  if (!TRANSLATED_LANGUAGES.includes(lang)) {
    console.error(
      `Unknown language "${lang}". Valid: ${TRANSLATED_LANGUAGES.join(", ")}. ` +
        "(Add a new language to TRANSLATED_LANGUAGES in scripts/lib.ts and LANG_NAMES here.)",
    );
    process.exit(1);
  }

  if (!PROVIDERS.includes(provider)) {
    console.error(`Unknown provider "${provider}". Valid: ${PROVIDERS.join(", ")}`);
    process.exit(1);
  }

  let retranslateRe: RegExp | null = null;
  if (retranslateMatching) {
    try {
      retranslateRe = new RegExp(retranslateMatching);
    } catch (err: any) {
      console.error(`Invalid --retranslate-matching regex: ${formatError(err)}`);
      process.exit(1);
    }
  }

  return { lang, provider, concurrency, force, retranslateModel, retranslateRe, retranslateKeys };
}

async function main() {
  const { lang, provider, concurrency, force, retranslateModel, retranslateRe, retranslateKeys } =
    parseArgs();
  const hasSelector = !!(retranslateModel || retranslateRe || retranslateKeys.length);

  const specPath = path.join(ORIGINAL_DIR, "open-api.json");
  if (!fs.existsSync(specPath)) {
    console.error("OpenAPI spec not found at", specPath);
    process.exit(1);
  }

  const specContent = fs.readFileSync(specPath, "utf-8");
  const sourceHash = sha256(specContent);

  // Check if already up to date. A selective re-translation (--retranslate-*) has
  // work to do even when the source is unchanged, so it bypasses this gate.
  const lock = readLock();
  const lockEntry = lock.languages[lang]?.["open-api.json"];
  if (!force && !hasSelector && lockEntry && lockEntry.sourceHash === sourceHash) {
    console.log(`open-api.json translation for ${lang} is up to date. Use --force to retranslate.`);
    return;
  }

  const spec = JSON.parse(specContent);

  // Extract translatable fields
  const fields: TextField[] = [];
  extractFields(spec, "", fields);
  console.log(`Extracted ${fields.length} translatable fields (${fields.reduce((s, f) => s + f.text.length, 0)} chars)`);

  // Dedup by source text — only unique texts ever get translated.
  const { uniqueTexts } = dedupeByText(fields);

  const systemPrompt = fs.readFileSync(
    path.join(PROMPTS_DIR, "translate-openapi.md"),
    "utf-8",
  );
  const promptHash = sha256(systemPrompt);

  // Load the prior TM. Under --force we bypass reuse (empty lookup) but still pass
  // `prior` to saveTM so createdAt survives.
  const prior = loadTM(lang);
  // `lookup` is a copy (we may delete from it for selective re-translation) — never
  // mutate prior.entries, which saveTM compares against to decide the timestamp bump.
  const lookup = force ? new Map<string, string>() : new Map(prior.entries);

  // Selective re-translation: drop matching entries from the lookup so they become
  // misses and get re-done with the current model chain (everything else stays reused).
  if (hasSelector && !force) {
    const keySet = new Set(retranslateKeys);
    let invalidated = 0;
    for (const [key, translation] of Array.from(lookup)) {
      const match =
        (retranslateModel && prior.models.get(key) === retranslateModel) ||
        (retranslateRe && retranslateRe.test(translation)) ||
        keySet.has(key);
      if (match) {
        lookup.delete(key);
        invalidated++;
      }
    }
    const sel = [
      retranslateModel && `model=${retranslateModel}`,
      retranslateRe && `matching=/${retranslateRe.source}/`,
      retranslateKeys.length && `keys=${retranslateKeys.length}`,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`Selective re-translation (${sel}): invalidated ${invalidated} TM entr${invalidated === 1 ? "y" : "ies"}.`);
  }

  // Split unique texts into reused (TM hit) and misses (need translation).
  // Empty strings are short-circuited to "" — never sent to the model and never
  // stored (the TM drops empty values on load anyway), so they aren't a perpetual miss.
  // Synthetic miss fields carry the hash key in `path` so reassembly binds by hash.
  const reused = new Map<string, string>();
  const missFields: TextField[] = [];
  for (const text of uniqueTexts) {
    if (text === "") continue;
    const key = tmKey(text);
    const hit = lookup.get(key);
    if (hit !== undefined) reused.set(key, hit);
    else missFields.push({ path: key, text });
  }

  // Chunk only the misses.
  const chunks = chunkFields(missFields);
  const modelChain = resolveModelChain(provider);
  const modelLabel = modelChain.length > 1 ? `${modelChain[0]} (fallbacks: ${modelChain.slice(1).join(", ")})` : modelChain[0];
  console.log(
    `unique ${uniqueTexts.length} / reused ${reused.size} / translated ${missFields.length} (${chunks.length} chunks)`,
  );
  console.log(`Translating to ${lang} (provider: ${provider}, model: ${modelLabel}, concurrency: ${concurrency})\n`);

  const client = createClient(provider);
  const model = modelChain;

  // Translate chunks with a concurrency pool. Each chunk is retried a few times,
  // rotating the model chain so a free model that reliably returns malformed JSON
  // is superseded by a fallback on the next attempt.
  const MAX_CHUNK_ATTEMPTS = 3;
  const results: ({ translations: string[]; model: string } | null)[] = new Array(chunks.length).fill(null);
  let failed = 0;
  let nextIndex = 0;

  function rotated(chain: string[], by: number): string[] {
    if (chain.length <= 1) return chain;
    const k = by % chain.length;
    return chain.slice(k).concat(chain.slice(0, k));
  }

  async function worker() {
    while (nextIndex < chunks.length) {
      const i = nextIndex++;
      for (let attempt = 1; attempt <= MAX_CHUNK_ATTEMPTS; attempt++) {
        try {
          results[i] = await translateChunk(
            client, provider, rotated(model, attempt - 1), systemPrompt, lang, chunks[i], i, chunks.length,
          );
          break;
        } catch (err: any) {
          if (attempt < MAX_CHUNK_ATTEMPTS) {
            console.warn(`  chunk ${i + 1} attempt ${attempt}/${MAX_CHUNK_ATTEMPTS} failed (${formatError(err)}); retrying`);
            continue;
          }
          failed++;
          console.error(`  FAILED chunk ${i + 1} after ${MAX_CHUNK_ATTEMPTS} attempts: ${formatError(err)}`);
        }
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    () => worker(),
  );
  await Promise.all(workers);

  // Build the fresh TM from reused hits + every SUCCESSFUL chunk (failed chunks are
  // skipped). Back-fill BY HASH WITHIN EACH CHUNK (never a cross-chunk cumulative index).
  // `entryModels` records, per entry, the model that produced it: carried forward for
  // reused hits, set to the chunk's actual model for fresh translations.
  const fresh = new Map(reused);
  const entryModels = new Map<string, string>();
  for (const key of reused.keys()) {
    const m = prior.models.get(key);
    if (m) entryModels.set(key, m);
  }
  for (let ci = 0; ci < chunks.length; ci++) {
    const r = results[ci];
    if (!r) continue;
    chunks[ci].forEach((f, ti) => {
      fresh.set(f.path /* = hash key */, r.translations[ti]);
      entryModels.set(f.path, r.model);
    });
  }
  // Distinct models that actually produced output this run (chunks may fall back).
  const modelsUsed = Array.from(new Set(results.flatMap((r) => (r ? [r.model] : [])))).sort();
  const runModels = modelsUsed.length > 0 ? modelsUsed : [modelChain[0]];
  const now = new Date().toISOString();

  if (failed > 0) {
    // Persist progress to the TM sidecar so a re-run retries ONLY the failed chunks.
    // Do NOT write the spec or lock — a half-translated spec mixing Polish with the
    // target language is worse than none, and the stale lock forces the re-run.
    saveTM(lang, fresh, entryModels, prior, { provider, models: runModels, promptHash, now });
    console.error(
      `\n${failed} chunk(s) failed after retries. Saved ${fresh.size} translations to the TM ` +
        `(spec NOT written). Re-run to retry only the ${failed} failed chunk(s).`,
    );
    process.exit(1);
  }

  // Apply the TM to ALL fields (dedup expansion) on a fresh spec copy.
  // Empty source fields map straight to "" (short-circuited above, never in `fresh`).
  const translatedSpec = JSON.parse(specContent);
  for (const f of fields) {
    setByPath(translatedSpec, f.path, f.text === "" ? "" : fresh.get(tmKey(f.text))!);
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

  // Write translated spec (idempotent — skip the write when bytes are unchanged)
  const outDir = path.join(TRANSLATIONS_DIR, lang);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "open-api.json");
  const out = JSON.stringify(translatedSpec, null, 2) + "\n";
  if (!fs.existsSync(outPath) || fs.readFileSync(outPath, "utf-8") !== out) {
    fs.writeFileSync(outPath, out);
  }
  console.log(`\nWritten: translations/${lang}/open-api.json`);

  // Persist the pruned TM (prunes stale entries, preserves createdAt via `prior`).
  saveTM(lang, fresh, entryModels, prior, { provider, models: runModels, promptHash, now });

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

  console.log(`\nDone! ${fields.length} fields applied (${missFields.length} newly translated, ${reused.size} reused).`);
}

export { parseMarkedResponse, FIELD_MARKER };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
