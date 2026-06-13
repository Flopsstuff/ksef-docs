// Smoke test for the pure cores of scripts/tm.ts.
// Run: npx ts-node scripts/test-tm.ts
// No external test deps, no filesystem, no network — only the pure functions.

import assert from "assert";
import {
  dedupeByText,
  parseTM,
  serializeTM,
  nextMeta,
  tmKey,
  sameEntries,
  TM_VERSION,
  TMMeta,
  RunInfo,
  TextField,
} from "./tm";

// --- tiny harness ----------------------------------------------------------
let pass = 0;
let fail = 0;
function check(cond: boolean, msg: string): void {
  if (cond) {
    pass++;
    console.log(`  ok   ${msg}`);
  } else {
    fail++;
    console.error(`  FAIL ${msg}`);
  }
}

// --- shared helpers --------------------------------------------------------
const run: RunInfo = {
  provider: "anthropic",
  models: ["claude-sonnet-4-6"],
  promptHash: "abc123",
  now: "2026-01-01T00:00:00.000Z",
};

function validMeta(overrides: Partial<TMMeta> = {}): TMMeta {
  return {
    tmVersion: TM_VERSION,
    lastRun: { provider: "anthropic", models: ["m"], promptHash: "h", at: "2025-12-31T00:00:00.000Z" },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
    ...overrides,
  };
}

// A meta object shaped for JSON input to parseTM (plain object, not TMMeta-typed).
function metaJSON(tmVersion: number = TM_VERSION): any {
  return {
    tmVersion,
    lastRun: { provider: "anthropic", models: ["m"], promptHash: "h", at: "2025-12-31T00:00:00.000Z" },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  };
}

// ===========================================================================
// A. parseTM validation ladder — none must throw; check resulting entries size.
// ===========================================================================
function noThrow<T>(fn: () => T): T {
  return fn();
}

check(noThrow(() => parseTM("")).entries.size === 0, 'parseTM("") -> empty (bad JSON)');
check(noThrow(() => parseTM("{not json")).entries.size === 0, 'parseTM("{not json") -> empty (bad JSON)');
check(noThrow(() => parseTM("[]")).entries.size === 0, 'parseTM("[]") -> empty (not an object)');

check(
  parseTM(JSON.stringify({ meta: metaJSON() })).entries.size === 0,
  "valid meta + entries missing -> empty",
);
check(
  parseTM(JSON.stringify({ meta: metaJSON(), entries: [] })).entries.size === 0,
  "valid meta + entries is array -> empty",
);
check(
  parseTM('{"entries":{"k":"v"}}').entries.size === 0,
  "missing meta entirely -> empty (tmVersion gate)",
);
check(
  parseTM(JSON.stringify({ meta: metaJSON(999), entries: { k: "v" } })).entries.size === 0,
  "meta.tmVersion === 999 -> empty (version mismatch)",
);

{
  const r = parseTM(
    JSON.stringify({
      meta: metaJSON(),
      entries: { k1: "good", k2: 123, k3: null, k4: "", k5: "ok" },
    }),
  );
  check(r.entries.size === 2, "lenient entries: keeps exactly 2 (k1,k5)");
  check(
    r.entries.get("k1") === "good" && r.entries.get("k5") === "ok",
    "lenient entries: k1='good', k5='ok' preserved",
  );
  check(
    !r.entries.has("k2") && !r.entries.has("k3") && !r.entries.has("k4"),
    "lenient entries: k2/k3/k4 dropped",
  );
}

{
  // tmVersion ok but garbled (missing) lastRun -> entries kept, meta === null.
  const badMeta: any = {
    tmVersion: TM_VERSION,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
    // lastRun intentionally missing
  };
  const r = parseTM(JSON.stringify({ meta: badMeta, entries: { k: "v" } }));
  check(r.entries.size === 1, "garbled lastRun: entries kept (size 1)");
  check(r.meta === null, "garbled lastRun: meta === null");
}

// ===========================================================================
// B. dedupeByText — first-seen order, grouped paths.
// ===========================================================================
{
  const dupText = "same text";
  const fields: TextField[] = [
    { path: "p1", text: dupText },
    { path: "p2", text: "second text" },
    { path: "p3", text: dupText },
    { path: "p4", text: "third text" },
    { path: "p5", text: dupText },
    { path: "p6", text: "second text" },
  ];
  const r = dedupeByText(fields);
  check(r.uniqueTexts.length === 3, "dedupeByText: 3 unique texts");
  check(r.uniqueTexts[0] === dupText, "dedupeByText: first-seen order preserved");
  check(r.pathsByText.get(dupText)!.length === 3, "dedupeByText: dupText held by 3 paths");
  let totalPaths = 0;
  for (const paths of r.pathsByText.values()) totalPaths += paths.length;
  check(totalPaths === fields.length, "dedupeByText: total path count equals input field count");
}

// ===========================================================================
// C. serializeTM / nextMeta / sameEntries
// ===========================================================================
{
  const meta = validMeta();
  const m = new Map<string, string>([
    ["k1", "v1"],
    ["k2", "v2"],
  ]);
  const mods = new Map<string, string>([
    ["k1", "model-a"],
    ["k2", "model-b"],
  ]);
  const s1 = serializeTM(meta, m, mods);
  const s2 = serializeTM(meta, m, mods);
  check(s1 === s2, "serializeTM: identical output on repeated calls");
  check(s1.endsWith("\n"), "serializeTM: output ends with newline");
  check(/"models"/.test(s1) && /model-a/.test(s1), "serializeTM: includes per-entry models map");

  // Same pairs, different insertion order -> identical serialization (key sort).
  const a = new Map<string, string>();
  a.set("zebra", "1");
  a.set("alpha", "2");
  a.set("mango", "3");
  const b = new Map<string, string>();
  b.set("alpha", "2");
  b.set("mango", "3");
  b.set("zebra", "1");
  const am = new Map<string, string>([["zebra", "z"], ["alpha", "a"], ["mango", "g"]]);
  const bm = new Map<string, string>([["alpha", "a"], ["mango", "g"], ["zebra", "z"]]);
  check(serializeTM(meta, a, am) === serializeTM(meta, b, bm), "serializeTM: key order independent");
}

{
  const prior = validMeta();

  // changed=false with prior -> verbatim (deep equal, no bump).
  const same = nextMeta(prior, false, run);
  assert.deepStrictEqual(same, prior);
  check(true, "nextMeta(prior, false, run): deep-equal to prior (no bump)");

  // changed=true -> bump updatedAt + lastRun.at, keep createdAt.
  const bumped = nextMeta(prior, true, run);
  check(bumped.updatedAt === run.now, "nextMeta(prior, true): updatedAt === run.now");
  check(bumped.lastRun.at === run.now, "nextMeta(prior, true): lastRun.at === run.now");
  check(bumped.createdAt === prior.createdAt, "nextMeta(prior, true): createdAt preserved");

  // null prior + changed=true -> createdAt = now.
  const fresh = nextMeta(null, true, run);
  check(fresh.createdAt === run.now, "nextMeta(null, true): createdAt === run.now");
}

{
  const a = new Map<string, string>([
    ["k1", "v1"],
    ["k2", "v2"],
  ]);
  const equal = new Map<string, string>([
    ["k1", "v1"],
    ["k2", "v2"],
  ]);
  const diffVal = new Map<string, string>([
    ["k1", "v1"],
    ["k2", "DIFFERENT"],
  ]);
  const diffSize = new Map<string, string>([["k1", "v1"]]);
  check(sameEntries(a, equal) === true, "sameEntries: true for equal maps");
  check(sameEntries(a, diffVal) === false, "sameEntries: false when a value differs");
  check(sameEntries(a, diffSize) === false, "sameEntries: false when size differs");
}

// tmKey sanity (pure, deterministic).
check(tmKey("hello") === tmKey("hello"), "tmKey: deterministic for same input");
check(tmKey("a") !== tmKey("b"), "tmKey: differs for different input");

// ===========================================================================
const total = pass + fail;
console.log(`\nPASS ${pass}/${total}`);
process.exit(fail ? 1 : 0);
