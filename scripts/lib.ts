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

/**
 * Build a verbose, single-string description of an error thrown by the
 * Anthropic SDK (or any fetch/network error). The SDK's `APIConnectionError`
 * only carries the message "Connection error." — the real cause lives in
 * `.cause`, and API errors carry `.status` / `.request_id` / a response body.
 */
export function formatError(err: any): string {
  if (!err) return String(err);
  const parts: string[] = [err.name ? `${err.name}: ${err.message}` : String(err.message ?? err)];

  if (err.status !== undefined) parts.push(`status=${err.status}`);
  const requestId = err.request_id ?? err.requestID ?? err.headers?.["request-id"];
  if (requestId) parts.push(`request_id=${requestId}`);

  // API error body (e.g. { error: { type, message } })
  const body = err.error ?? err.response?.data;
  if (body && typeof body === "object") {
    const inner = body.error ?? body;
    if (inner?.type || inner?.message) {
      parts.push(`api_error=${inner.type ?? "?"}: ${inner.message ?? ""}`.trim());
    }
  }

  // Rate-limit hints
  const retryAfter = err.headers?.["retry-after"];
  if (retryAfter) parts.push(`retry-after=${retryAfter}s`);

  // Underlying network cause (APIConnectionError wraps the real error here)
  const cause = err.cause;
  if (cause) {
    const causeBits = [cause.code, cause.message].filter(Boolean).join(" ");
    parts.push(`cause=${causeBits || JSON.stringify(cause)}`);
    if (cause.cause) {
      const c2 = cause.cause;
      parts.push(`cause.cause=${[c2.code, c2.message].filter(Boolean).join(" ") || JSON.stringify(c2)}`);
    }
  }

  return parts.join(" | ");
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

const TRANSLATED_LANGUAGES = ["ru", "en", "uk"];

export { ROOT, ORIGINAL_DIR, TRANSLATIONS_DIR, LOCK_PATH, TRANSLATED_LANGUAGES };
