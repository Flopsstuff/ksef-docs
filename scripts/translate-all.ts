import { execSync } from "child_process";

/**
 * Runs both translate:docs and translate:openapi with the same --lang argument.
 * translate:docs receives all arguments as-is.
 * translate:openapi receives only --lang, --provider, --concurrency, and --force.
 */

const args = process.argv.slice(2);

// Extract --lang value
const langArg = args.find((a) => a.startsWith("--lang"));
if (!langArg) {
  console.error("Usage: yarn translate --lang=<lang> [--all | --outdated | file1 ...] [--force]");
  process.exit(1);
}

// Normalize --lang=xx or --lang xx
let lang: string;
if (langArg.includes("=")) {
  lang = langArg.split("=")[1];
} else {
  const idx = args.indexOf(langArg);
  lang = args[idx + 1] || "";
}

if (!lang) {
  console.error("Missing language value");
  process.exit(1);
}

const passthrough = args.join(" ");

// Build openapi args: only lang, provider, concurrency, force
const openapiArgs = [`--lang=${lang}`];
for (const arg of args) {
  if (arg.startsWith("--provider=")) openapiArgs.push(arg);
  if (arg.startsWith("--concurrency=")) openapiArgs.push(arg);
  if (arg === "--force") openapiArgs.push(arg);
}

const stdio = { stdio: "inherit" as const };

console.log("=== Translating docs ===\n");
execSync(`ts-node scripts/translate.ts ${passthrough}`, { ...stdio, cwd: process.cwd() });

console.log("\n=== Translating OpenAPI spec ===\n");
execSync(`ts-node scripts/translate-openapi.ts ${openapiArgs.join(" ")}`, { ...stdio, cwd: process.cwd() });
