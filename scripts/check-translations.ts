import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { ORIGINAL_DIR, TRANSLATIONS_DIR, TRANSLATED_LANGUAGES, findOriginalMdFiles } from "./lib";
import { checkTranslation, stripBanner } from "./validate";

/**
 * Audit every markdown translation for structural completeness against the
 * current original (headings, code fences, size ratio — see validate.ts).
 * Exits non-zero if any translation looks truncated or broken, so it can gate CI.
 *
 *   yarn check:translations            # all languages
 *   yarn check:translations --lang=ru  # one language
 */
function main() {
  const lang = process.argv.find((a) => a.startsWith("--lang="))?.split("=")[1];
  const langs = lang ? [lang] : TRANSLATED_LANGUAGES;
  let bad = 0;
  let checked = 0;

  for (const l of langs) {
    for (const file of findOriginalMdFiles()) {
      const tPath = path.join(TRANSLATIONS_DIR, l, file);
      if (!fs.existsSync(tPath)) continue;
      checked++;
      const original = fs.readFileSync(path.join(ORIGINAL_DIR, file), "utf-8");
      const body = stripBanner(matter(fs.readFileSync(tPath, "utf-8")).content);
      const problems = checkTranslation(original, body);
      if (problems.length > 0) {
        bad++;
        console.log(`  ✗ ${l}/${file}: ${problems.join("; ")}`);
      }
    }
  }

  console.log(`\n${checked - bad}/${checked} translations look structurally complete.`);
  if (bad > 0) process.exit(1);
}

main();
