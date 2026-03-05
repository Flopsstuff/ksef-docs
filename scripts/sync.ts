import { execSync } from "child_process";
import {
  ROOT,
  readLock,
  writeLock,
  getSubmoduleCommit,
  findOriginalMdFiles,
  getFileStatuses,
} from "./lib";

const SUPPORTED_LANGS = ["ru", "en"];

function main() {
  // Pull latest upstream
  console.log("Updating submodule...");
  execSync("git submodule update --remote original", { cwd: ROOT, stdio: "inherit" });

  const newCommit = getSubmoduleCommit();
  const lock = readLock();
  const oldCommit = lock.sourceCommit;

  if (oldCommit && oldCommit === newCommit) {
    console.log(`\nSubmodule is up to date (${newCommit.slice(0, 7)})`);
  } else if (oldCommit) {
    console.log(`\nSubmodule updated: ${oldCommit.slice(0, 7)} -> ${newCommit.slice(0, 7)}`);
  } else {
    console.log(`\nSubmodule commit: ${newCommit.slice(0, 7)}`);
  }

  // Update sourceCommit in lock
  lock.sourceCommit = newCommit;
  writeLock(lock);

  const files = findOriginalMdFiles();
  console.log(`\nFound ${files.length} .md files in original/\n`);

  // Show status per language
  for (const lang of SUPPORTED_LANGS) {
    const statuses = getFileStatuses(lang);
    const newFiles = statuses.filter((s) => s.status === "new");
    const outdated = statuses.filter((s) => s.status === "outdated");
    const upToDate = statuses.filter((s) => s.status === "up-to-date");
    const deleted = statuses.filter((s) => s.status === "deleted");

    console.log(`[${lang}] ${upToDate.length} up-to-date, ${outdated.length} outdated, ${newFiles.length} new, ${deleted.length} deleted`);
  }
}

main();
