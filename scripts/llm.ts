import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import OpenAI from "openai";

export type Provider = "anthropic" | "bedrock" | "openrouter";

export const PROVIDERS: Provider[] = ["anthropic", "bedrock", "openrouter"];

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Deterministic output for translation — minimise variation between runs.
const TEMPERATURE = 0;

/** Fallback model per provider, used when nothing is set via env or CLI. */
const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  bedrock: "eu.anthropic.claude-sonnet-4-20250514-v1:0",
  openrouter: "anthropic/claude-sonnet-4.5",
};

/** Provider-specific env var that can override the model for that provider. */
const PROVIDER_MODEL_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_MODEL",
  bedrock: "BEDROCK_MODEL",
  openrouter: "OPENROUTER_MODEL",
};

/**
 * Resolve the model id for a provider. Precedence (first match wins):
 *   1. `override` — e.g. a `--model` CLI flag
 *   2. `TRANSLATION_MODEL` — generic env var, applies to any provider
 *   3. provider-specific env var (`ANTHROPIC_MODEL` / `BEDROCK_MODEL` / `OPENROUTER_MODEL`)
 *   4. built-in default for the provider
 * Resolved lazily (reads env at call time, after dotenv has loaded).
 */
export function resolveModel(provider: Provider, override?: string): string {
  return (
    override ||
    process.env.TRANSLATION_MODEL ||
    process.env[PROVIDER_MODEL_ENV[provider]] ||
    DEFAULT_MODELS[provider]
  );
}

export function createClient(provider: Provider): any {
  if (provider === "bedrock") {
    return new AnthropicBedrock({
      awsRegion: process.env.AWS_REGION || "eu-central-1",
    });
  }
  if (provider === "openrouter") {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      // OpenRouter uses these for attribution / rankings (optional).
      defaultHeaders: {
        "HTTP-Referer": "https://flopsstuff.github.io/ksef-docs/",
        "X-Title": "KSeF Docs Translations",
      },
    });
  }
  return new Anthropic();
}

export interface LlmResult {
  text: string;
  usage: { input: number; output: number };
}

export interface CompleteOptions {
  client: any;
  provider: Provider;
  model: string;
  system: string;
  userContent: string;
  maxTokens: number;
  timeoutMs?: number;
}

/**
 * Unified streaming completion across providers. Streaming keeps the socket
 * active during long generations (avoids read ETIMEDOUT). Returns the full
 * text plus token usage. Anthropic/Bedrock use the Messages API; OpenRouter
 * uses the OpenAI-compatible Chat Completions API.
 */
export async function streamComplete(opts: CompleteOptions): Promise<LlmResult> {
  const { client, provider, model, system, userContent, maxTokens, timeoutMs = 300_000 } = opts;

  if (provider === "openrouter") {
    const stream = await client.chat.completions.create(
      {
        model,
        max_tokens: maxTokens,
        temperature: TEMPERATURE,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      },
      { timeout: timeoutMs },
    );

    let text = "";
    let input = 0;
    let output = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) text += delta;
      if (chunk.usage) {
        input = chunk.usage.prompt_tokens ?? input;
        output = chunk.usage.completion_tokens ?? output;
      }
    }
    return { text, usage: { input, output } };
  }

  // anthropic & bedrock — Messages API
  const msg = await client.messages
    .stream(
      { model, max_tokens: maxTokens, temperature: TEMPERATURE, system, messages: [{ role: "user", content: userContent }] },
      { timeout: timeoutMs },
    )
    .finalMessage();

  const text = msg.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return {
    text,
    usage: { input: msg.usage?.input_tokens ?? 0, output: msg.usage?.output_tokens ?? 0 },
  };
}
