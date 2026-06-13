// Per-text translation memory (TM) for the OpenAPI spec.
//
// The spec has ~1387 translatable fields but only ~702 unique texts. Instead of
// re-translating everything on any change, we dedup by source text, key a memory
// by sha256(source_text) -> translation, translate only the misses, and reuse the
// rest. The TM is a committed sidecar per language: translations/<lang>/open-api.tm.json
//
// Design notes (see PLAN-openapi-incremental-translation.md for the full rationale):
// - Keys are content-addressed only, so the TM survives provider/model/fallback swaps.
// - `meta` is observability-only EXCEPT `tmVersion`, which hard-gates a discard on
//   mismatch (the value shape / hashing rule may have changed).
// - Loading is lenient: a corrupted file never crashes the run — at worst it yields an
//   empty TM (full re-translate), and a few malformed entries are dropped individually.
// - Serialization sorts entry keys and pins meta key order so byte output is stable
//   (idempotent no-op runs, minimal git diffs).

import * as fs from "fs";
import * as path from "path";
import { sha256, TRANSLATIONS_DIR } from "./lib";

export const TM_VERSION = 2;
export const TM_FILE = "open-api.tm.json";

export interface TextField {
  path: string;
  text: string;
}

export interface TMMeta {
  tmVersion: number;
  // `models` is the DISTINCT set of models that actually wrote entries on the last
  // run — chunks can fall back to different models, so a single id would be a lie.
  lastRun: { provider: string; models: string[]; promptHash: string; at: string };
  createdAt: string;
  updatedAt: string;
}

export interface RunInfo {
  provider: string;
  models: string[];
  promptHash: string;
  now: string;
}

export interface DedupeResult {
  uniqueTexts: string[]; // first-seen order (deterministic)
  pathsByText: Map<string, string[]>; // text -> every path that holds it
}

export interface LoadedTM {
  entries: Map<string, string>; // sha256(text) -> translation (validated, maybe empty)
  models: Map<string, string>; // sha256(text) -> model that produced it (per-entry provenance)
  meta: TMMeta | null; // prior meta if well-formed, else null (rewritten on save)
}

// ---------------------------------------------------------------------------
// Pure cores (smoke-tested directly, no filesystem / network)
// ---------------------------------------------------------------------------

export function tmKey(text: string): string {
  return sha256(text);
}

// Collapse duplicate source texts. Preserves first-seen order so downstream chunk
// packing is deterministic across runs.
export function dedupeByText(fields: TextField[]): DedupeResult {
  const uniqueTexts: string[] = [];
  const pathsByText = new Map<string, string[]>();
  for (const f of fields) {
    let paths = pathsByText.get(f.text);
    if (!paths) {
      paths = [];
      pathsByText.set(f.text, paths);
      uniqueTexts.push(f.text);
    }
    paths.push(f.path);
  }
  return { uniqueTexts, pathsByText };
}

// Validation ladder. Always returns a usable LoadedTM (entries possibly empty);
// never throws. Order matters:
//   1. bad JSON          -> empty
//   2. not an object     -> empty
//   3. tmVersion mismatch/missing (hard gate) -> empty
//   4. entries not object -> empty
//   5. lenient per-entry: keep non-empty strings, drop the rest (count warned)
// A correct tmVersion but garbled lastRun/createdAt/updatedAt keeps the entries and
// returns meta=null (a fresh meta is written on the next save).
export function parseTM(raw: string): LoadedTM {
  const empty = (): LoadedTM => ({ entries: new Map(), models: new Map(), meta: null });

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn("⚠️ TM: invalid JSON — starting with an empty TM.");
    return empty();
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    console.warn("⚠️ TM: top-level is not an object — starting with an empty TM.");
    return empty();
  }

  const version = data.meta && typeof data.meta === "object" ? data.meta.tmVersion : undefined;
  if (version !== TM_VERSION) {
    console.warn(
      `⚠️ TM: version ${version ?? "missing"} != expected ${TM_VERSION} — discarding (incompatible schema).`,
    );
    return empty();
  }

  const entriesRaw = data.entries;
  if (entriesRaw === null || typeof entriesRaw !== "object" || Array.isArray(entriesRaw)) {
    console.warn("⚠️ TM: `entries` missing or not an object — starting with an empty TM.");
    return empty();
  }

  const entries = new Map<string, string>();
  let dropped = 0;
  for (const [k, v] of Object.entries(entriesRaw)) {
    if (typeof v === "string" && v.length > 0) {
      entries.set(k, v);
    } else {
      dropped++;
    }
  }
  if (dropped > 0) {
    console.warn(
      `⚠️ TM: dropped ${dropped} malformed entr${dropped === 1 ? "y" : "ies"} (non-string/empty); kept ${entries.size}.`,
    );
  }

  // Per-entry model provenance (parallel map, same keys as entries). Lenient: keep
  // string values; a missing/garbled `models` map just yields empty provenance.
  const models = new Map<string, string>();
  const modelsRaw = data.models;
  if (modelsRaw && typeof modelsRaw === "object" && !Array.isArray(modelsRaw)) {
    for (const [k, v] of Object.entries(modelsRaw)) {
      if (typeof v === "string" && v.length > 0) models.set(k, v);
    }
  }

  return { entries, models, meta: parseMeta(data.meta) };
}

// meta is observability-only beyond tmVersion. Returns null (not a throw) if any
// observability field is missing/garbled — the caller rewrites a fresh meta on save.
function parseMeta(raw: any): TMMeta | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.tmVersion !== TM_VERSION) return null;
  const lr = raw.lastRun;
  const lastRunOk =
    lr &&
    typeof lr === "object" &&
    typeof lr.provider === "string" &&
    Array.isArray(lr.models) &&
    lr.models.every((m: any) => typeof m === "string") &&
    typeof lr.promptHash === "string" &&
    typeof lr.at === "string";
  if (!lastRunOk || typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
    return null;
  }
  return {
    tmVersion: TM_VERSION,
    lastRun: { provider: lr.provider, models: lr.models, promptHash: lr.promptHash, at: lr.at },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// Deterministic serialization: entry/model keys sorted, meta key order pinned, same
// `JSON.stringify(x, null, 2) + "\n"` convention as writeLock / the spec write.
export function serializeTM(
  meta: TMMeta,
  entries: Map<string, string>,
  models: Map<string, string>,
): string {
  const sortObj = (m: Map<string, string>): Record<string, string> => {
    const o: Record<string, string> = {};
    for (const k of Array.from(m.keys()).sort()) o[k] = m.get(k)!;
    return o;
  };
  const obj = {
    meta: {
      tmVersion: meta.tmVersion,
      lastRun: {
        provider: meta.lastRun.provider,
        models: meta.lastRun.models,
        promptHash: meta.lastRun.promptHash,
        at: meta.lastRun.at,
      },
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
    },
    entries: sortObj(entries),
    models: sortObj(models),
  };
  return JSON.stringify(obj, null, 2) + "\n";
}

// The timestamp-bump decision. When nothing changed and we have a prior meta, return
// it verbatim so the serialized bytes are identical (idempotent no-op). Otherwise
// stamp updatedAt/lastRun.at = now and preserve createdAt.
export function nextMeta(prior: TMMeta | null, changed: boolean, run: RunInfo): TMMeta {
  if (!changed && prior) return prior;
  return {
    tmVersion: TM_VERSION,
    lastRun: { provider: run.provider, models: run.models, promptHash: run.promptHash, at: run.now },
    createdAt: prior?.createdAt ?? run.now,
    updatedAt: run.now,
  };
}

export function sameEntries(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Filesystem wrappers (used by translate-openapi.ts)
// ---------------------------------------------------------------------------

export function tmPath(lang: string): string {
  return path.join(TRANSLATIONS_DIR, lang, TM_FILE);
}

export function loadTM(lang: string): LoadedTM {
  const p = tmPath(lang);
  let raw: string;
  try {
    raw = fs.readFileSync(p, "utf-8");
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      console.warn(
        `⚠️ TM: could not read ${TM_FILE} for ${lang} (${err?.code ?? err}) — starting with an empty TM.`,
      );
    }
    return { entries: new Map(), models: new Map(), meta: null };
  }
  return parseTM(raw);
}

// Rebuilds the file from the full current entry set (prunes stale entries). Bumps
// meta timestamps only when entries or per-entry models changed semantically, and
// skips the write entirely when the serialized bytes match what's already on disk.
export function saveTM(
  lang: string,
  entries: Map<string, string>,
  models: Map<string, string>,
  prior: LoadedTM,
  run: RunInfo,
): { written: boolean; entriesChanged: boolean } {
  const entriesChanged =
    !sameEntries(prior.entries, entries) || !sameEntries(prior.models, models);
  const meta = nextMeta(prior.meta, entriesChanged, run);
  const serialized = serializeTM(meta, entries, models);

  const p = tmPath(lang);
  let existing: string | null = null;
  try {
    existing = fs.readFileSync(p, "utf-8");
  } catch {
    existing = null;
  }
  if (existing === serialized) {
    return { written: false, entriesChanged };
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, serialized);
  return { written: true, entriesChanged };
}
