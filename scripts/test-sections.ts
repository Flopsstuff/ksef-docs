// Smoke test for scripts/validate.ts and scripts/sections.ts — the guards that
// keep a truncated LLM reply out of translations/ and the section reuse logic.
// Run: yarn test:sections  (no network, no filesystem)

import { checkTranslation, mdStructure, stripWrapperTags } from "./validate";
import { splitSections, planSections, makeBatches } from "./sections";

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

const body = (n: number) => `Tekst opisu zmiany numer ${n}. `.repeat(12);
const version = (v: string, extra = "") => `### Wersja ${v}\n${body(v.length)}${extra}\n`;
const changelog = (versions: string[]) => `## Zmiany w API 2.0\n\n` + versions.map((v) => version(v)).join("\n");
// "Translation": same structure, different words.
const translate = (md: string) => md.replace(/Wersja/g, "Version").replace(/Tekst opisu zmiany numer/g, "Description of change no.");

const VERSIONS = ["2.10.0", "2.9.0", "2.0.0 RC6.1", "2.0.0 RC5.2", "2.0.0 RC5", "2.0.0 RC2"];

console.log("validate.ts");
{
  const orig = changelog(VERSIONS);
  check(checkTranslation(orig, translate(orig)).length === 0, "complete translation passes");
  check(checkTranslation(orig, "").join() === "empty translation", "empty reply is rejected");
  const cut = translate(orig).split("### Version 2.0.0 RC5.2")[0];
  check(checkTranslation(orig, cut).some((p) => p.startsWith("headings differ")), "reply cut off before the last sections is rejected");
  const withCode = "## A\n\n```csharp\nvar x = 1;\n```\n\n## B\n\n```java\nint y;\n```\n";
  check(checkTranslation(withCode, withCode.split("## B")[0] + "## B\n\n```java\n").length > 0, "reply cut off inside a code block is rejected");
  check(mdStructure("```Token KSeF``` jest wydawany\n## H\n").headings.length === 1, "inline ```code``` at line start is not a fence");
  check(checkTranslation(orig, translate(orig) + "\n</original>\n").some((p) => p.startsWith("prompt wrapper tag leaked")), "echoed </original> is rejected");
  check(stripWrapperTags("<original>\n## A\ntext\n\n</original>\n").trim() === "## A\ntext", "echoed wrapper tags at the edges are stripped");
  check(mdStructure("```csharp\n# not a heading\n```\n# real\n").headings.length === 1, "# inside a code block is not a heading");
}

console.log("sections.ts");
{
  const s = splitSections(changelog(VERSIONS));
  check(s.length === 1 + 1 + VERSIONS.length, "split: preamble + h2 + one section per version");
  check(new Set(s.map((x) => x.sig)).size === s.length, "RC versions get distinct signatures (not all '2.0.0')");
  check(splitSections(translate(changelog(VERSIONS)))[4].sig === s[4].sig, "signature survives translation of the heading word");
}
{
  // Unchanged source, complete translation: everything reused.
  const orig = changelog(VERSIONS);
  const p = planSections(orig, orig, translate(orig));
  check(makeBatches(p.sections, p.result, 12 * 1024).length === 0, "unchanged + complete -> nothing to translate");
}
{
  // New version on top + an edit inside an existing one.
  const old = changelog(VERSIONS);
  const cur = `## Zmiany w API 2.0\n\n` + [version("2.11.0"), version("2.10.0", "\n- nowy punkt\n"), ...VERSIONS.slice(1).map((v) => version(v))].join("\n");
  const p = planSections(cur, old, translate(old));
  const todo = makeBatches(p.sections, p.result, 12 * 1024).flat().map((i) => p.sections[i].text.split("\n")[0]);
  check(todo.join("|") === "### Wersja 2.11.0|### Wersja 2.10.0", "new + edited sections translated, rest reused");
  const i2100 = p.sections.findIndex((x) => x.text.startsWith("### Wersja 2.10.0"));
  check(!!p.refFor(i2100)?.startsWith("### Version 2.10.0"), "edited section gets its previous translation as reference");
}
{
  // Truncated translation (the 19.11 failure mode): tail sections and the cut one are retranslated.
  const orig = changelog(VERSIONS);
  const t = translate(orig);
  const cut = t.slice(0, t.indexOf("### Version 2.0.0 RC5\n") + 40); // ends mid-section
  const p = planSections(orig, orig, cut);
  const todo = makeBatches(p.sections, p.result, 12 * 1024).flat().map((i) => p.sections[i].text.split("\n")[0]);
  check(todo.join("|") === "### Wersja 2.0.0 RC5|### Wersja 2.0.0 RC2", "truncated translation: cut section and missing tail retranslated");
}
{
  // Translation missing a middle section: alignment stops there, nothing after it is misattributed.
  const orig = changelog(VERSIONS);
  const t = translate(changelog(VERSIONS.filter((v) => v !== "2.9.0")));
  const p = planSections(orig, orig, t);
  const reusedHeads = p.result.filter((r) => r && r.startsWith("### ")).map((r) => r!.split("\n")[0]);
  check(reusedHeads.join("|") === "### Version 2.10.0", "middle gap: only sections before the gap are reused");
}
{
  // No old original (e.g. commit unavailable): translate everything, in size-bounded batches.
  const orig = changelog(VERSIONS);
  const p = planSections(orig, null, translate(orig));
  const batches = makeBatches(p.sections, p.result, 1024);
  check(batches.flat().length === VERSIONS.length + 1, "no old original -> all sections translated");
  check(batches.length > 1, "batches respect the byte limit");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
