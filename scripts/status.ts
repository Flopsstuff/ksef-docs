import { getFileStatuses, findOriginalMdFiles } from "./lib";

const SUPPORTED_LANGS = ["ru", "en"];

const ICONS: Record<string, string> = {
  "up-to-date": "✓",
  outdated: "✗",
  new: "+",
  deleted: "−",
};

function main() {
  const lang = process.argv.find((a) => a.startsWith("--lang="))?.split("=")[1];
  const langs = lang ? [lang] : SUPPORTED_LANGS;

  for (const l of langs) {
    console.log(`\n=== ${l.toUpperCase()} ===\n`);
    const statuses = getFileStatuses(l);

    for (const s of statuses) {
      const icon = ICONS[s.status];
      const label =
        s.status === "new"
          ? "new, not translated"
          : s.status === "outdated"
            ? `outdated (${s.lockHash!.slice(0, 8)} -> ${s.currentHash!.slice(0, 8)})`
            : s.status === "deleted"
              ? "deleted from original"
              : "up to date";
      console.log(`  ${icon} ${s.file} — ${label}`);
    }

    const summary = {
      "up-to-date": statuses.filter((s) => s.status === "up-to-date").length,
      outdated: statuses.filter((s) => s.status === "outdated").length,
      new: statuses.filter((s) => s.status === "new").length,
      deleted: statuses.filter((s) => s.status === "deleted").length,
    };

    console.log(
      `\n  Total: ${summary["up-to-date"]} up-to-date, ${summary.outdated} outdated, ${summary.new} new, ${summary.deleted} deleted`
    );
  }
}

main();
