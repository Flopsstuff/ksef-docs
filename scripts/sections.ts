/**
 * Section-level planning for large documents (see translateSectioned in
 * translate.ts): split markdown at headings, align an existing translation with
 * the original it was made from, decide which sections can be reused verbatim
 * and group the rest into request-sized batches. Pure functions, no I/O.
 */
import { checkTranslation, FENCE_RE } from "./validate";

export interface Section {
  /** Section text: a heading line and everything up to the next heading. */
  text: string;
  /** Heading level 1–6; 0 for the preamble before the first heading. */
  level: number;
  /**
   * Language-invariant signature of the heading: level plus numbers and inline
   * code (e.g. "3|2.0.0|5.2" for both "### Wersja 2.0.0 RC5.2" and "### Версия
   * 2.0.0 RC5.2"). Used to align a translation's sections with its original's.
   */
  sig: string;
}

export const norm = (s: string) => s.replace(/\s+$/, "");

function headingSig(level: number, line: string): string {
  const tokens = line.match(/`[^`]+`|\d+(?:\.\d+)*/g) || [];
  return [level, ...tokens].join("|");
}

/** Split markdown at every heading outside fenced code blocks. */
export function splitSections(md: string): Section[] {
  const sections: Section[] = [{ text: "", level: 0, sig: "0" }];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (FENCE_RE.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^(#{1,6})\s+\S/);
    if (h) {
      const level = h[1].length;
      sections.push({ text: line + "\n", level, sig: headingSig(level, line) });
    } else {
      sections[sections.length - 1].text += line + "\n";
    }
  }
  return sections;
}

/**
 * Pair sections of the old original with sections of its translation. Pairs are
 * matched in order while their heading signatures agree; a pair is reusable only
 * if it passes the structural check (so a section cut off mid-way is not reused).
 * If the translation ran out of sections early, its last one is suspect too.
 * Returns translated text per old-original section index (undefined = none).
 */
export function alignTranslation(oldOrig: Section[], trans: Section[]): (string | undefined)[] {
  const out: (string | undefined)[] = new Array(oldOrig.length).fill(undefined);
  let k = 0;
  while (k < oldOrig.length && k < trans.length && oldOrig[k].sig === trans[k].sig) k++;
  if (k === trans.length && k < oldOrig.length) k--; // translation ended early
  for (let i = 0; i < k; i++) {
    if (!norm(oldOrig[i].text)) continue;
    if (checkTranslation(oldOrig[i].text, trans[i].text).length === 0) out[i] = trans[i].text;
  }
  return out;
}

export interface SectionPlan {
  sections: Section[];
  /** Per section: reused translation, "" for an empty section, undefined = to translate. */
  result: (string | undefined)[];
  /** Previous translation of a section to translate (if one is identifiable), as a reference. */
  refFor: (i: number) => string | undefined;
}

/**
 * Plan a sectioned translation. A section is reused when its exact text existed
 * in the old original (`oldContent`, the source the existing translation was
 * made from) and that old section has a sound aligned translation.
 */
export function planSections(
  originalContent: string,
  oldContent: string | null,
  existingTranslation: string,
): SectionPlan {
  const sections = splitSections(originalContent);
  const reuse = new Map<string, string[]>();
  // Previous translation per heading signature, only when the signature is unique.
  const refBySig = new Map<string, string | null>();

  if (oldContent && existingTranslation) {
    const oldSections = splitSections(oldContent);
    const aligned = alignTranslation(oldSections, splitSections(existingTranslation));
    oldSections.forEach((s, i) => {
      const t = aligned[i];
      if (t === undefined) return;
      const key = norm(s.text);
      reuse.set(key, [...(reuse.get(key) || []), t]);
      refBySig.set(s.sig, refBySig.has(s.sig) ? null : t);
    });
  }

  const result = sections.map((s) => {
    if (!norm(s.text)) return "";
    const list = reuse.get(norm(s.text));
    return list && list.length > 0 ? list.shift() : undefined;
  });

  return {
    sections,
    result,
    refFor: (i) => {
      const s = sections[i];
      return s.level > 0 && s.sig !== String(s.level) ? refBySig.get(s.sig) ?? undefined : undefined;
    },
  };
}

/** Group consecutive sections still to translate into batches of at most `maxBytes`. */
export function makeBatches(sections: Section[], result: (string | undefined)[], maxBytes: number): number[][] {
  const batches: number[][] = [];
  let cur: number[] = [];
  let curBytes = 0;
  const flush = () => {
    if (cur.length) batches.push(cur);
    cur = [];
    curBytes = 0;
  };
  sections.forEach((s, i) => {
    if (result[i] !== undefined) return flush();
    const bytes = Buffer.byteLength(s.text, "utf-8");
    if (cur.length && curBytes + bytes > maxBytes) flush();
    cur.push(i);
    curBytes += bytes;
  });
  flush();
  return batches;
}
