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

/**
 * Resolve an ordered list of models to try: the primary (via `resolveModel`)
 * followed by numbered fallbacks read from the environment. Fallback i (i ≥ 2)
 * is `TRANSLATION_MODEL_<i>` or, failing that, `<PROVIDER>_MODEL_<i>`
 * (e.g. `OPENROUTER_MODEL_2`). Scanning stops after a small fixed range.
 *
 * An explicit `override` (e.g. a `--model` CLI flag) disables fallbacks — the
 * caller asked for exactly that model.
 */
export function resolveModelChain(provider: Provider, override?: string): string[] {
  if (override) return [override];
  const chain = [resolveModel(provider)];
  const providerEnv = PROVIDER_MODEL_ENV[provider];
  for (let i = 2; i <= 10; i++) {
    const m = process.env[`TRANSLATION_MODEL_${i}`] || process.env[`${providerEnv}_${i}`];
    if (m && !chain.includes(m)) chain.push(m);
  }
  return chain;
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
  /** The model that actually produced this result (may be a fallback). */
  model: string;
}

export interface CompleteOptions {
  client: any;
  provider: Provider;
  /** A single model, or an ordered fallback chain (each tried until one succeeds). */
  model: string | string[];
  system: string;
  userContent: string;
  maxTokens: number;
  timeoutMs?: number;
  /** Called when a model fails and the next one in the chain is about to be tried. */
  onFallback?: (failed: string, next: string, error: string) => void;
}

function errMessage(err: any): string {
  const msg = err?.message || String(err);
  // Avoid "404 404 ..." when the SDK message already starts with the status code.
  if (err?.status && !msg.startsWith(String(err.status))) return `${err.status} ${msg}`.trim();
  return msg;
}

/**
 * Unified streaming completion across providers, with model fallback. `model`
 * may be a single id or an ordered chain — each is tried in turn until one
 * succeeds; if all fail, the last error is thrown. Streaming keeps the socket
 * active during long generations (avoids read ETIMEDOUT). Anthropic/Bedrock use
 * the Messages API; OpenRouter uses the OpenAI-compatible Chat Completions API.
 */
export async function streamComplete(opts: CompleteOptions): Promise<LlmResult> {
  const models = Array.isArray(opts.model) ? opts.model : [opts.model];
  let lastErr: any;
  for (let i = 0; i < models.length; i++) {
    try {
      return await streamOne(opts, models[i]);
    } catch (err) {
      lastErr = err;
      if (i < models.length - 1) opts.onFallback?.(models[i], models[i + 1], errMessage(err));
    }
  }
  throw lastErr;
}

/** Single-model streaming completion (one attempt, no fallback). */
async function streamOne(opts: CompleteOptions, model: string): Promise<LlmResult> {
  const { client, provider, system, userContent, maxTokens, timeoutMs = 300_000 } = opts;

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
    return { text, usage: { input, output }, model };
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
    model,
  };
}
