import dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { ROOT, formatError } from "./lib";
import { createClient, streamComplete } from "./llm";

// Make .env authoritative, same as the translation/check scripts.
dotenv.config({ override: true });

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DOC_PATH = join(ROOT, "output", "openrouter-free-models-benchmark.md");

// Same probe as check-provider.ts: translate one KSeF sentence into EN/RU/UK.
const SYSTEM_PROMPT =
  "You are a translation provider connectivity check. Translate the given Polish text into English, Russian and Ukrainian. Respond with exactly three lines and nothing else, in this format:\nEN: {translation}\nRU: {translation}\nUK: {translation}";
const PROBE_TEXT =
  "Faktura została pomyślnie przyjęta przez Krajowy System e-Faktur i otrzymała numer KSeF.";

interface Args {
  runs: number;
  concurrency: number;
  limit?: number;
  models?: string[];
  timeoutMs: number;
  updateDoc: boolean;
}

function parseArgs(): Args {
  const args: Args = { runs: 3, concurrency: 1, timeoutMs: 60_000, updateDoc: false };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--runs=")) args.runs = Number(arg.split("=")[1]);
    else if (arg.startsWith("--concurrency=")) args.concurrency = Number(arg.split("=")[1]);
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.split("=")[1]);
    else if (arg.startsWith("--models=")) args.models = arg.split("=")[1].split(",").map((m) => m.trim()).filter(Boolean);
    else if (arg.startsWith("--timeout=")) args.timeoutMs = Number(arg.split("=")[1]) * 1000;
    else if (arg === "--update-doc") args.updateDoc = true;
  }
  return args;
}

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
}

// Non-translation utility models that pass the modality check but aren't chat
// translators: safety/moderation classifiers, the auto-router, alpha/test slugs.
const SKIP_PATTERNS = [/content-safety/i, /\bguard\b/i, /moderation/i, /^openrouter\/free$/i, /owl-alpha/i];

/**
 * Keep models that are free AND can do text→text translation:
 *   - zero prompt + completion price,
 *   - output is text only (drops audio/image generators like lyria),
 *   - text is an accepted input modality,
 *   - not a known non-translation utility model (see SKIP_PATTERNS).
 */
function isTranslatable(m: OpenRouterModel): boolean {
  if (m.pricing?.prompt !== "0" || m.pricing?.completion !== "0") return false;
  const out = m.architecture?.output_modalities ?? ["text"];
  const inp = m.architecture?.input_modalities ?? ["text"];
  if (!(out.length === 1 && out[0] === "text")) return false;
  if (!inp.includes("text")) return false;
  if (SKIP_PATTERNS.some((re) => re.test(m.id))) return false;
  return true;
}

/** Fetch all models from OpenRouter and keep the free, translation-capable ones. */
async function fetchFreeModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter /models returned ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { data: OpenRouterModel[] };
  return json.data.filter(isTranslatable).sort((a, b) => a.id.localeCompare(b.id));
}

interface RunResult {
  ok: boolean;
  ms: number;
  output: number;
  text: string;
  error?: string;
}

interface ModelResult {
  id: string;
  runs: RunResult[];
  successes: number;
  avgMs: number | null;
  sampleRu: string;
  verdict: string;
}

async function probeOnce(client: any, model: string, timeoutMs: number): Promise<RunResult> {
  const started = Date.now();
  try {
    const { text, usage } = await streamComplete({
      client,
      provider: "openrouter",
      model,
      system: SYSTEM_PROMPT,
      userContent: PROBE_TEXT,
      maxTokens: 512,
      timeoutMs,
    });
    return { ok: text.trim().length > 0, ms: Date.now() - started, output: usage.output, text: text.trim() };
  } catch (err: any) {
    return { ok: false, ms: Date.now() - started, output: 0, text: "", error: formatError(err) };
  }
}

function shortError(runs: RunResult[]): string {
  const err = runs.map((r) => r.error).find(Boolean) || "";
  if (/\b429\b/.test(err)) return "429 (rate-limited)";
  if (/\b404\b/.test(err)) return "404 (gone/paid)";
  if (/timeout|ETIMEDOUT|timed out/i.test(err)) return "timeout";
  if (err) return err.slice(0, 60);
  return "empty output";
}

function ruLine(text: string): string {
  const line = text.split("\n").find((l) => /^RU:/i.test(l.trim()));
  return (line || "").replace(/^RU:\s*/i, "").trim();
}

function buildResult(id: string, runs: RunResult[]): ModelResult {
  const successful = runs.filter((r) => r.ok);
  const successes = successful.length;
  const avgMs = successes > 0 ? Math.round(successful.reduce((s, r) => s + r.ms, 0) / successes) : null;
  const sampleRu = successful.map((r) => ruLine(r.text)).find(Boolean) || "";

  let verdict: string;
  if (successes === 0) verdict = `❌ Unavailable — ${shortError(runs)}`;
  else if (successes < runs.length) verdict = `⚠️ Unstable (${successes}/${runs.length}) — ${shortError(runs)}`;
  else verdict = `✅ Reliable — avg ${avgMs} ms`;

  return { id, runs, successes, avgMs, sampleRu, verdict };
}

async function runPool<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return results;
}

function escapeCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function renderDoc(results: ModelResult[], runs: number, dateIso: string): string {
  const lines: string[] = [];
  lines.push("# OpenRouter Free Models — Translation Benchmark (KSeF)");
  lines.push("");
  lines.push(
    `Generated by \`yarn benchmark:free\` on ${dateIso}. Test: translate one Polish KSeF sentence into EN/RU/UK, ${runs} run(s) per model, provider \`openrouter\`. Free models are discovered live from the OpenRouter \`/models\` API (zero prompt+completion price).`,
  );
  lines.push("");
  lines.push("| # | Model | Success | Avg ms | RU sample | Verdict |");
  lines.push("|---|-------|---------|--------|-----------|---------|");
  results.forEach((r, i) => {
    const success = `${r.successes}/${runs}`;
    const avg = r.avgMs ?? "—";
    const sample = r.sampleRu ? escapeCell(r.sampleRu).slice(0, 80) : "—";
    lines.push(`| ${i + 1} | ${escapeCell(r.id)} | ${success} | ${avg} | ${sample} | ${escapeCell(r.verdict)} |`);
  });
  lines.push("");

  const reliable = results
    .filter((r) => r.successes === runs && r.avgMs !== null)
    .sort((a, b) => (a.avgMs! - b.avgMs!));
  lines.push("## Top reliable (3/3, fastest first)");
  lines.push("");
  if (reliable.length === 0) {
    lines.push("_None passed all runs in this benchmark._");
  } else {
    reliable.slice(0, 5).forEach((r, i) => {
      lines.push(`${i + 1}. **${r.id}** — avg ${r.avgMs} ms. RU: "${r.sampleRu}"`);
    });
  }
  lines.push("");
  lines.push(
    "> Re-run with `yarn benchmark:free --update-doc` to refresh. Free-tier availability on OpenRouter changes often (429/404), so treat this as a snapshot.",
  );
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs();

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY is not set (check your .env).");
    process.exit(1);
  }

  let models: string[];
  if (args.models?.length) {
    models = args.models;
    console.log(`Testing ${models.length} model(s) from --models.`);
  } else {
    console.log("Fetching free models from OpenRouter…");
    const free = await fetchFreeModels();
    models = free.map((m) => m.id);
    console.log(`Found ${models.length} free model(s).`);
    if (args.limit) models = models.slice(0, args.limit);
  }

  const client = createClient("openrouter");
  console.log(`Running ${args.runs} run(s) per model, concurrency ${args.concurrency}…\n`);

  const results = await runPool(models, args.concurrency, async (id, idx) => {
    const runs: RunResult[] = [];
    for (let i = 0; i < args.runs; i++) {
      runs.push(await probeOnce(client, id, args.timeoutMs));
    }
    const result = buildResult(id, runs);
    console.log(`[${idx + 1}/${models.length}] ${id.padEnd(55)} ${result.verdict}`);
    return result;
  });

  // Sort: reliable first (by speed), then unstable, then unavailable.
  const rank = (r: ModelResult) => (r.successes === args.runs ? 0 : r.successes > 0 ? 1 : 2);
  results.sort((a, b) => rank(a) - rank(b) || (a.avgMs ?? Infinity) - (b.avgMs ?? Infinity));

  const reliable = results.filter((r) => r.successes === args.runs).length;
  const unstable = results.filter((r) => r.successes > 0 && r.successes < args.runs).length;
  const dead = results.filter((r) => r.successes === 0).length;
  console.log(`\nSummary: ${reliable} reliable, ${unstable} unstable, ${dead} unavailable (of ${results.length}).`);

  if (args.updateDoc) {
    const dateIso = new Date().toISOString().slice(0, 10);
    mkdirSync(dirname(DOC_PATH), { recursive: true });
    writeFileSync(DOC_PATH, renderDoc(results, args.runs, dateIso));
    console.log(`\nWrote ${DOC_PATH}`);
  } else {
    console.log("\n(Run with --update-doc to write output/openrouter-free-models-benchmark.md)");
  }
}

main().catch((err) => {
  console.error(formatError(err));
  process.exit(1);
});
