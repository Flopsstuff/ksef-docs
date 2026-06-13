import { execSync } from "child_process";
import { TRANSLATED_LANGUAGES } from "./lib";

/**
 * Runs both translate:docs and translate:openapi with the same --lang argument.
 * Supports --lang=all to translate all languages sequentially.
 * translate:docs receives all arguments as-is.
 * translate:openapi receives only --lang, --provider, --concurrency, and --force.
 */

const args = process.argv.slice(2);

// Extract --lang value
const langArg = args.find((a) => a.startsWith("--lang"));
if (!langArg) {
  console.error("Usage: yarn translate --lang=<lang|all> [--all | --outdated | file1 ...] [--force]");
  process.exit(1);
}

// Normalize --lang=xx or --lang xx
let langValue: string;
if (langArg.includes("=")) {
  langValue = langArg.split("=")[1];
} else {
  const idx = args.indexOf(langArg);
  langValue = args[idx + 1] || "";
}

if (!langValue) {
  console.error("Missing language value");
  process.exit(1);
}

const langs = langValue === "all" ? TRANSLATED_LANGUAGES : [langValue];

// Args without --lang (will be re-added per language)
const otherArgs = args.filter((a) => a !== langArg && a !== langValue);

const stdio = { stdio: "inherit" as const };

// Run a sub-step, but never let its failure abort the whole pipeline: a 429 on
// one language's OpenAPI spec must not throw away another language's already
// translated docs (which translate.ts has written to disk). We track per-step
// outcomes and decide the exit code at the end. Successful work is committed by
// the workflow as long as this process exits 0.
let total = 0;
let failures = 0;

function runStep(label: string, command: string): void {
  total++;
  try {
    execSync(command, { ...stdio, cwd: process.cwd() });
  } catch (err: any) {
    failures++;
    console.error(`\n⚠️ Step failed (${label}): ${err?.message || err}. Continuing with remaining steps.`);
  }
}

for (const lang of langs) {
  const docsArgs = [`--lang=${lang}`, ...otherArgs].join(" ");

  // Build openapi args: only lang, provider, concurrency, force
  const openapiArgs = [`--lang=${lang}`];
  for (const arg of otherArgs) {
    if (arg.startsWith("--provider=")) openapiArgs.push(arg);
    if (arg.startsWith("--concurrency=")) openapiArgs.push(arg);
    if (arg === "--force") openapiArgs.push(arg);
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`=== Translating [${lang}] docs ===`);
  console.log(`${"=".repeat(40)}\n`);
  runStep(`${lang} docs`, `ts-node scripts/translate.ts ${docsArgs}`);

  console.log(`\n=== Translating [${lang}] OpenAPI spec ===\n`);
  runStep(`${lang} openapi`, `ts-node scripts/translate-openapi.ts ${openapiArgs.join(" ")}`);
}

console.log(`\nDone! ${total - failures}/${total} steps succeeded across ${langs.length} language(s): ${langs.join(", ")}`);

// Only fail the whole run if EVERYTHING failed (likely a config/key/provider
// outage). Partial success exits 0 so the workflow still commits what worked;
// the lock file only advanced for completed files, so the rest retries next run.
if (failures === total && total > 0) {
  console.error("\nAll translation steps failed — exiting non-zero.");
  process.exit(1);
}
