import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const ORIGINAL_DIR = path.join(ROOT, "original");
const TRANSLATIONS_DIR = path.join(ROOT, "translations");
const SITE_DIR = path.join(ROOT, "site");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".gif"]);
const TRANSLATED_LANGUAGES = ["ru", "en", "uk"];
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

// Sidebar structure: groups with file paths (order matters)
// "index" refers to README.md/index.md
const SIDEBAR_STRUCTURE = [
  {
    group: "intro",
    files: ["index", "przeglad-kluczowych-zmian-ksef-api-2-0", "api-changelog", "srodowiska"],
  },
  {
    group: "auth",
    files: [
      "uwierzytelnianie",
      "auth/sesje",
      "auth/podpis-xades",
      "auth/testowe-certyfikaty-i-podpisy-xades",
      "auth/context-identifier-nip",
      "auth/context-identifier-nip-vat-ue",
      "auth/context-identifier-internal-id",
      "auth/subject-identifier-type-certificate-subject",
      "auth/subject-identifier-type-certificate-fingerprint",
    ],
  },
  { group: "certs", files: ["certyfikaty-KSeF"] },
  { group: "permissions", files: ["uprawnienia"] },
  {
    group: "offline",
    files: [
      "tryby-offline",
      "offline/korekta-techniczna",
      "offline/automatyczne-okreslanie-trybu-offline",
    ],
  },
  {
    group: "sessions",
    files: ["sesja-interaktywna", "sesja-wsadowa"],
  },
  {
    group: "invoices",
    files: [
      "faktury/numer-ksef",
      "faktury/weryfikacja-faktury",
      "faktury/sesja-sprawdzenie-stanu-i-pobranie-upo",
    ],
  },
  {
    group: "download",
    files: [
      "pobieranie-faktur/pobieranie-faktur",
      "pobieranie-faktur/przyrostowe-pobieranie-faktur",
      "pobieranie-faktur/hwm",
    ],
  },
  {
    group: "other",
    files: [
      "kody-qr",
      "tokeny-ksef",
      "limity/limity",
      "limity/limity-api",
      "dane-testowe-scenariusze",
    ],
  },
];

// Group labels per language
const GROUP_LABELS: Record<string, Record<string, string>> = {
  pl: {
    intro: "Wprowadzenie",
    auth: "Uwierzytelnianie",
    certs: "Certyfikaty",
    permissions: "Uprawnienia",
    offline: "Tryby offline",
    sessions: "Sesje",
    invoices: "Faktury",
    download: "Pobieranie faktur",
    other: "Pozostałe",
  },
  ru: {
    intro: "Введение",
    auth: "Аутентификация",
    certs: "Сертификаты",
    permissions: "Разрешения",
    offline: "Офлайн режимы",
    sessions: "Сессии",
    invoices: "Счета-фактуры",
    download: "Получение счетов-фактур",
    other: "Прочее",
  },
  en: {
    intro: "Introduction",
    auth: "Authentication",
    certs: "Certificates",
    permissions: "Permissions",
    offline: "Offline Modes",
    sessions: "Sessions",
    invoices: "Invoices",
    download: "Downloading Invoices",
    other: "Other",
  },
  uk: {
    intro: "Вступ",
    auth: "Автентифікація",
    certs: "Сертифікати",
    permissions: "Дозволи",
    offline: "Офлайн режими",
    sessions: "Сесії",
    invoices: "Рахунки-фактури",
    download: "Завантаження рахунків-фактур",
    other: "Інше",
  },
};

function fileToTitle(file: string): string {
  const base = path.basename(file);
  return base.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractTitle(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  // Match first heading (# or ##), strip markdown bold/escape chars
  const match = content.match(/^#{1,2}\s+\**(.+?)\**\s*$/m);
  if (!match) return null;
  return match[1].replace(/\\/g, "").replace(/\*\*/g, "").trim();
}

function generateSidebars() {
  const sidebars: Record<string, any[]> = {};

  for (const lang of ALL_LANGUAGES) {
    const langDir = path.join(SITE_DIR, lang);
    if (!fs.existsSync(langDir)) continue;

    const labels = GROUP_LABELS[lang];
    if (!labels) continue;

    const sidebar: any[] = [];

    for (const { group, files } of SIDEBAR_STRUCTURE) {
      const items: any[] = [];
      for (const file of files) {
        const mdPath = file === "index"
          ? path.join(langDir, "index.md")
          : path.join(langDir, `${file}.md`);
        if (!fs.existsSync(mdPath)) continue;
        const title = extractTitle(mdPath) || fileToTitle(file);

        const link = file === "index"
          ? `/${lang}/`
          : `/${lang}/${file}`;
        items.push({ text: title, link });
      }
      if (items.length > 0) {
        sidebar.push({ text: labels[group] || group, items });
      }
    }

    sidebars[lang] = sidebar;
  }

  const outPath = path.join(SITE_DIR, ".vitepress", "sidebars.json");
  fs.writeFileSync(outPath, JSON.stringify(sidebars, null, 2) + "\n");
  console.log("Generated sidebars.json");
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

// Generate sidebar config from page headings
generateSidebars();

console.log("Site content prepared.");
