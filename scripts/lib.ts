import { execSync } from "child_process";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const ORIGINAL_DIR = path.join(ROOT, "original");
const TRANSLATIONS_DIR = path.join(ROOT, "translations");
const LOCK_PATH = path.join(ROOT, "translation.lock.json");

export interface FileLock {
  sourceHash: string;
  translatedAt: string;
}

export interface LockFile {
  sourceCommit: string;
  languages: Record<string, Record<string, FileLock>>;
}

export function readLock(): LockFile {
  const raw = fs.readFileSync(LOCK_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeLock(lock: LockFile): void {
  fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + "\n");
}

export function getSubmoduleCommit(): string {
  return execSync("git -C original rev-parse HEAD", { cwd: ROOT })
    .toString()
    .trim();
}

export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function findOriginalMdFiles(): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        results.push(path.relative(ORIGINAL_DIR, full));
      }
    }
  }

  walk(ORIGINAL_DIR);
  return results.sort();
}

export type FileStatus = "up-to-date" | "outdated" | "new" | "deleted";

export interface FileInfo {
  file: string;
  status: FileStatus;
  currentHash: string | null;
  lockHash: string | null;
}

export function getFileStatuses(lang: string): FileInfo[] {
  const lock = readLock();
  const langLock = lock.languages[lang] || {};
  const originalFiles = findOriginalMdFiles();
  const result: FileInfo[] = [];

  for (const file of originalFiles) {
    const content = fs.readFileSync(path.join(ORIGINAL_DIR, file), "utf-8");
    const currentHash = sha256(content);
    const entry = langLock[file];

    if (!entry) {
      result.push({ file, status: "new", currentHash, lockHash: null });
    } else if (entry.sourceHash !== currentHash) {
      result.push({
        file,
        status: "outdated",
        currentHash,
        lockHash: entry.sourceHash,
      });
    } else {
      result.push({
        file,
        status: "up-to-date",
        currentHash,
        lockHash: entry.sourceHash,
      });
    }
  }

  // Files in lock but not in original anymore
  for (const file of Object.keys(langLock)) {
    if (!originalFiles.includes(file)) {
      result.push({ file, status: "deleted", currentHash: null, lockHash: langLock[file].sourceHash });
    }
  }

  return result;
}

export { ROOT, ORIGINAL_DIR, TRANSLATIONS_DIR, LOCK_PATH };
