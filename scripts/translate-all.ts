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
  execSync(`ts-node scripts/translate.ts ${docsArgs}`, { ...stdio, cwd: process.cwd() });

  console.log(`\n=== Translating [${lang}] OpenAPI spec ===\n`);
  execSync(`ts-node scripts/translate-openapi.ts ${openapiArgs.join(" ")}`, { ...stdio, cwd: process.cwd() });
}

console.log(`\nDone! Translated ${langs.length} language(s): ${langs.join(", ")}`);
