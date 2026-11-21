/**
 * Structural sanity checks for a markdown translation against its original.
 *
 * An LLM response can be silently incomplete: cut off at the output-token limit,
 * empty, or simply missing the tail of the document. Such output must never be
 * written to disk or recorded in the lock file. These checks compare structure
 * that a faithful translation preserves 1:1 — headings and fenced code blocks —
 * plus a coarse size ratio, so they are language-agnostic.
 */

export interface MdStructure {
  /** Heading levels (1–6) in document order, outside fenced code blocks. */
  headings: number[];
  /** Number of fence lines (``` or ~~~). A complete document has an even count. */
  fences: number;
  /** Length of the text, whitespace-insensitive. */
  chars: number;
}

/** Lower bound for translated/original size; a cut-off text falls far below. */
const MIN_SIZE_RATIO = 0.6;
const MAX_SIZE_RATIO = 2.5;
/** Below this many characters the size ratio is too noisy (a lone heading). */
const MIN_CHARS_FOR_RATIO = 300;

/**
 * A fence line is ``` / ~~~ plus an optional info string — not inline code that
 * merely starts a line (upstream writes e.g. "```Token KSeF``` jest ...").
 */
export const FENCE_RE = /^\s*(`{3,}[^`]*|~{3,}.*)$/;

export function mdStructure(md: string): MdStructure {
  const headings: number[] = [];
  let fences = 0;
  let inFence = false;
  for (const line of md.split("\n")) {
    if (FENCE_RE.test(line)) {
      fences++;
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const h = line.match(/^(#{1,6})\s+\S/);
    if (h) headings.push(h[1].length);
  }
  return { headings, fences, chars: md.replace(/\s+/g, "").length };
}

/** Tags translate.ts wraps prompt parts in; a model sometimes echoes them back. */
const WRAPPER_TAG_RE = /<\/?(original|previous_translation|new_sections)>/g;

/** Drop wrapper tag lines a model echoed at the very start or end of its reply. */
export function stripWrapperTags(reply: string): string {
  return reply
    .replace(/^\s*<(original|previous_translation|new_sections)>[ \t]*\n/, "")
    .replace(/\n[ \t]*<\/(original|previous_translation|new_sections)>\s*$/, "\n");
}

/** Strip the translation banner line that translate.ts prepends to the body. */
export function stripBanner(body: string): string {
  return body.replace(/^\s*> \*\*Translation\.\*\*.*\n+/, "");
}

/**
 * Compare a translation body (no frontmatter, no banner) with its original.
 * Returns a list of human-readable problems; empty means it looks complete.
 */
export function checkTranslation(original: string, translated: string): string[] {
  const problems: string[] = [];
  if (!translated.trim()) return ["empty translation"];

  const o = mdStructure(original);
  const t = mdStructure(translated);

  if (o.headings.join(",") !== t.headings.join(",")) {
    problems.push(`headings differ: original ${o.headings.length}, translation ${t.headings.length}`);
  }
  const leaked = (translated.match(WRAPPER_TAG_RE) || []).filter((tag) => !original.includes(tag));
  if (leaked.length > 0) {
    problems.push(`prompt wrapper tag leaked: ${[...new Set(leaked)].join(", ")}`);
  }
  if (o.fences !== t.fences) {
    problems.push(`code fences differ: original ${o.fences}, translation ${t.fences}`);
  }
  if (o.chars >= MIN_CHARS_FOR_RATIO) {
    const ratio = t.chars / o.chars;
    if (ratio < MIN_SIZE_RATIO || ratio > MAX_SIZE_RATIO) {
      problems.push(`size ratio ${ratio.toFixed(2)} outside [${MIN_SIZE_RATIO}, ${MAX_SIZE_RATIO}]`);
    }
  }
  return problems;
}
