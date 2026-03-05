import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const ORIGINAL_DIR = path.join(ROOT, "original");
const TRANSLATIONS_DIR = path.join(ROOT, "translations");
const SITE_DIR = path.join(ROOT, "site");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".gif"]);
const TRANSLATED_LANGUAGES = ["ru", "en"];
const ALL_LANGUAGES = ["pl", ...TRANSLATED_LANGUAGES];

function copyImages(srcDir: string, destDir: string, relPath = "") {
  const fullSrc = path.join(srcDir, relPath);
  if (!fs.existsSync(fullSrc)) return;

  for (const entry of fs.readdirSync(fullSrc, { withFileTypes: true })) {
    const entryRel = path.join(relPath, entry.name);
    if (entry.isDirectory()) {
      copyImages(srcDir, destDir, entryRel);
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const destPath = path.join(destDir, entryRel);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(path.join(srcDir, entryRel), destPath);
    }
  }
}

// Standard HTML tags that Vue/VitePress should handle normally
const HTML_TAGS = new Set([
  "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base",
  "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption",
  "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del",
  "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5",
  "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input",
  "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark",
  "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option",
  "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt",
  "ruby", "s", "samp", "script", "section", "select", "small", "source",
  "span", "strong", "style", "sub", "summary", "sup", "table", "tbody",
  "td", "template", "textarea", "tfoot", "th", "thead", "time", "title",
  "tr", "track", "u", "ul", "var", "video", "wbr",
]);

/**
 * Escape angle brackets that Vue would misinterpret as component tags.
 * Preserves: standard HTML tags, code blocks, and inline code.
 */
function escapeVueConflicts(content: string): string {
  const lines = content.split("\n");
  let inCodeBlock = false;
  const result: string[] = [];

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Outside code blocks: escape <word> patterns that aren't standard HTML
    // Process segments outside inline code
    const parts = line.split(/(`[^`]*`)/);
    const escaped = parts.map((part, i) => {
      // Odd indices are inline code — leave as-is
      if (i % 2 === 1) return part;
      // Escape <tag> where tag is not a standard HTML element
      return part.replace(/<(\/?)([\w-]+)/g, (match, slash, tag) => {
        if (HTML_TAGS.has(tag.toLowerCase())) return match;
        return `&lt;${slash}${tag}`;
      });
    });
    result.push(escaped.join(""));
  }

  return result.join("\n");
}

function stripFrontmatter(content: string): string {
  const { content: body } = matter(content);
  return escapeVueConflicts(body.trimStart());
}

function copyMarkdownDir(srcDir: string, destDir: string, hasTranslationFrontmatter: boolean) {
  if (!fs.existsSync(srcDir)) return false;

  fs.mkdirSync(destDir, { recursive: true });

  function walkAndCopy(relPath = "") {
    const fullSrc = path.join(srcDir, relPath);
    for (const entry of fs.readdirSync(fullSrc, { withFileTypes: true })) {
      const entryRel = path.join(relPath, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(path.join(destDir, entryRel), { recursive: true });
        walkAndCopy(entryRel);
      } else if (entry.name.endsWith(".md")) {
        const content = fs.readFileSync(path.join(srcDir, entryRel), "utf-8");
        const processed = hasTranslationFrontmatter
          ? stripFrontmatter(content)
          : escapeVueConflicts(content);

        // README.md → index.md for VitePress
        const destName =
          entry.name === "README.md"
            ? path.join(relPath, "index.md")
            : entryRel;
        fs.writeFileSync(path.join(destDir, destName), processed);
      }
    }
  }

  walkAndCopy();
  return true;
}

function prepareLang(lang: string) {
  const destDir = path.join(SITE_DIR, lang);

  if (lang === "pl") {
    // Polish — copy directly from original/
    if (!copyMarkdownDir(ORIGINAL_DIR, destDir, false)) return;
    // Images are already in place (copied from same source)
    copyImages(ORIGINAL_DIR, destDir);
  } else {
    // Translated languages — copy from translations/<lang>/
    const srcDir = path.join(TRANSLATIONS_DIR, lang);
    if (!fs.existsSync(srcDir)) {
      console.log(`Skipping ${lang} — no translations found`);
      return;
    }
    copyMarkdownDir(srcDir, destDir, true);
    copyImages(ORIGINAL_DIR, destDir);
  }

  console.log(`Prepared site/${lang}/`);
}

// Clean existing generated content
for (const lang of ALL_LANGUAGES) {
  const destDir = path.join(SITE_DIR, lang);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
}

// Build for each language
for (const lang of ALL_LANGUAGES) {
  prepareLang(lang);
}

console.log("Site content prepared.");
