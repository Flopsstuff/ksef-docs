import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { formatError } from "./lib";

// Make .env authoritative, same as the translation scripts.
dotenv.config({ override: true });

type Provider = "anthropic" | "bedrock";

// Keep in sync with scripts/translate.ts
const MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
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
  const model = modelOverride || MODELS[provider];

  console.log(`Provider:  ${provider}`);
  console.log(`Model:     ${model}`);
  if (provider === "anthropic") {
    console.log(`API key:   ${mask(process.env.ANTHROPIC_API_KEY)}`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("\n❌ ANTHROPIC_API_KEY is not set (check your .env).");
      process.exit(1);
    }
  } else {
    console.log(`AWS region: ${process.env.AWS_REGION || "eu-central-1"}`);
    console.log(`AWS creds:  AWS_PROFILE=${process.env.AWS_PROFILE || "(unset)"}, AWS_ACCESS_KEY_ID=${mask(process.env.AWS_ACCESS_KEY_ID)}`);
  }

  const client: any = createClient(provider);
  const started = Date.now();

  try {
    console.log("\nSending a tiny test request…");
    const res = await client.messages.create(
      {
        model,
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      },
      { timeout: 30_000 },
    );
    const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    const ms = Date.now() - started;
    console.log(`\n✅ Works. (${ms} ms)`);
    console.log(`   Response: ${JSON.stringify(text)}`);
    if (res.usage) {
      console.log(`   Tokens:   in=${res.usage.input_tokens}, out=${res.usage.output_tokens}`);
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
