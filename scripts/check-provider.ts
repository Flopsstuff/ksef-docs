import dotenv from "dotenv";
import { formatError } from "./lib";
import { Provider, PROVIDERS, resolveModelChain, createClient, streamComplete } from "./llm";

// Make .env authoritative, same as the translation scripts.
dotenv.config({ override: true });

function parseArgs(): { provider: Provider; model?: string } {
  let provider: Provider = (process.env.TRANSLATION_PROVIDER as Provider) || "anthropic";
  let model: string | undefined;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--provider=")) provider = arg.split("=")[1] as Provider;
    else if (arg.startsWith("--model=")) model = arg.split("=")[1];
  }
  return { provider, model };
}

function mask(value: string | undefined): string {
  if (!value) return "(not set)";
  return value.length <= 8 ? "***" : `…${value.slice(-4)} (len=${value.length})`;
}

async function main() {
  const { provider, model: modelOverride } = parseArgs();

  if (!PROVIDERS.includes(provider)) {
    console.error(`Unknown provider "${provider}". Valid: ${PROVIDERS.join(", ")}`);
    process.exit(1);
  }

  const modelChain = resolveModelChain(provider, modelOverride);

  console.log(`Provider:  ${provider}`);
  console.log(`Model:     ${modelChain[0]}`);
  if (modelChain.length > 1) console.log(`Fallbacks: ${modelChain.slice(1).join(", ")}`);
  if (provider === "anthropic") {
    console.log(`API key:   ${mask(process.env.ANTHROPIC_API_KEY)}`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("\n❌ ANTHROPIC_API_KEY is not set (check your .env).");
      process.exit(1);
    }
  } else if (provider === "openrouter") {
    console.log(`API key:   ${mask(process.env.OPENROUTER_API_KEY)}`);
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("\n❌ OPENROUTER_API_KEY is not set (check your .env).");
      process.exit(1);
    }
  } else {
    console.log(`AWS region: ${process.env.AWS_REGION || "eu-central-1"}`);
    console.log(`AWS creds:  AWS_PROFILE=${process.env.AWS_PROFILE || "(unset)"}, AWS_ACCESS_KEY_ID=${mask(process.env.AWS_ACCESS_KEY_ID)}`);
  }

  const client = createClient(provider);
  const started = Date.now();

  try {
    console.log("\nSending a tiny test request…");
    const { text, usage, model } = await streamComplete({
      client,
      provider,
      model: modelChain,
      system: "You are a translation provider connectivity check. Translate the given Polish text into English, Russian and Ukrainian. Respond with exactly three lines and nothing else, in this format:\nEN: {translation}\nRU: {translation}\nUK: {translation}",
      userContent: "Faktura została pomyślnie przyjęta przez Krajowy System e-Faktur i otrzymała numer KSeF.",
      maxTokens: 512,
      timeoutMs: 30_000,
      onFallback: (failed, next, error) => console.warn(`   ⚠️ ${failed} failed (${error}); trying ${next}`),
    });
    const ms = Date.now() - started;
    const via = model !== modelChain[0] ? ` via fallback ${model}` : "";
    console.log(`\n✅ Works${via}. (${ms} ms)  tokens: in=${usage.input}, out=${usage.output}`);
    console.log("   Response:");
    for (const line of text.trim().split("\n")) {
      console.log(`     ${line}`);
    }
  } catch (err: any) {
    const ms = Date.now() - started;
    console.error(`\n❌ Failed after ${ms} ms:`);
    console.error(`   ${formatError(err)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(formatError(err));
  process.exit(1);
});
