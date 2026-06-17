import fs from "fs/promises";
import path from "path";
import { PATHS, REPO_ROOT } from "./paths";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".csv",
]);

const HIDDEN_NAMES = new Set([
  "secrets.local.json",
  "agent.pid",
  "live.jsonl",
  "auto-restart.json",
  "agent-pause.json",
  "chats.json",
  "NEXT_PROMPT.md",
  "QUESTIONS.md",
  "questions.json",
  ".env",
  ".env.local",
  ".gitkeep",
]);

const HIDDEN_DIRS = new Set(["chats"]);

const WRITABLE_PREFIXES = ["state/resources", "state/product"];

export interface ResourceEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  modifiedAt?: string;
  mime?: string;
}

export interface ResourceListResult {
  path: string;
  entries: ResourceEntry[];
  breadcrumbs: { label: string; path: string }[];
  writable: boolean;
}

export class ResourcePathError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ResourcePathError";
  }
}

function normalizeRelPath(relPath: string): string {
  const cleaned = relPath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\.\./g, "");
  if (!cleaned || cleaned === ".") return "state";
  return cleaned;
}

function resolveFullPath(relPath: string): string {
  const normalized = normalizeRelPath(relPath);
  const full = path.resolve(REPO_ROOT, normalized);
  const stateRoot = path.resolve(PATHS.state);
  if (!full.startsWith(stateRoot + path.sep) && full !== stateRoot) {
    throw new ResourcePathError("Path must be under state/");
  }
  return full;
}

function relFromFull(fullPath: string): string {
  return path.relative(REPO_ROOT, fullPath).replace(/\\/g, "/");
}

function isHiddenName(name: string): boolean {
  return HIDDEN_NAMES.has(name) || name.startsWith(".");
}

function isHiddenRelPath(relPath: string): boolean {
  const parts = normalizeRelPath(relPath).split("/");
  if (parts[0] !== "state") return true;
  for (const part of parts.slice(1)) {
    if (HIDDEN_NAMES.has(part) || HIDDEN_DIRS.has(part)) return true;
  }
  return false;
}

function isWritableRelPath(relPath: string): boolean {
  const normalized = normalizeRelPath(relPath);
  return WRITABLE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function mimeForFile(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}

function isTextMime(mime: string): boolean {
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/markdown"
  );
}

export function assertReadablePath(relPath: string): string {
  const normalized = normalizeRelPath(relPath);
  if (isHiddenRelPath(normalized)) {
    throw new ResourcePathError("Path not accessible", 403);
  }
  return normalized;
}

export function assertWritablePath(relPath: string): string {
  const normalized = assertReadablePath(relPath);
  if (!isWritableRelPath(normalized)) {
    throw new ResourcePathError("Path is read-only", 403);
  }
  return normalized;
}

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^\w.\-() ]+/g, "_");
  if (!base || base.startsWith(".")) {
    throw new ResourcePathError("Invalid filename");
  }
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ResourcePathError(`File type not allowed: ${ext || "(none)"}`);
  }
  return base;
}

export function buildBreadcrumbs(relPath: string): { label: string; path: string }[] {
  const normalized = normalizeRelPath(relPath);
  const parts = normalized.split("/");
  const crumbs: { label: string; path: string }[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    crumbs.push({ label: part, path: current });
  }
  return crumbs;
}

async function entryFromPath(fullPath: string, relPath: string): Promise<ResourceEntry | null> {
  const name = path.basename(fullPath);
  if (isHiddenName(name)) return null;

  const stat = await fs.stat(fullPath).catch(() => null);
  if (!stat) return null;

  if (stat.isDirectory()) {
    if (HIDDEN_DIRS.has(name)) return null;
    return {
      name,
      path: relPath,
      type: "dir",
      modifiedAt: stat.mtime.toISOString(),
    };
  }

  return {
    name,
    path: relPath,
    type: "file",
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    mime: mimeForFile(name),
  };
}

export async function ensureResourcesDir(): Promise<void> {
  await fs.mkdir(PATHS.resources, { recursive: true });
}

export async function listResourcesDir(relPath = "state"): Promise<ResourceListResult> {
  await ensureResourcesDir();
  const normalized = assertReadablePath(relPath);
  const full = resolveFullPath(normalized);

  const stat = await fs.stat(full).catch(() => null);
  if (!stat) throw new ResourcePathError("Path not found", 404);
  if (!stat.isDirectory()) throw new ResourcePathError("Not a directory");

  const names = await fs.readdir(full);
  const entries: ResourceEntry[] = [];

  for (const name of names.sort((a, b) => a.localeCompare(b))) {
    if (isHiddenName(name) || HIDDEN_DIRS.has(name)) continue;
    const childFull = path.join(full, name);
    const childRel = relFromFull(childFull);
    if (isHiddenRelPath(childRel)) continue;
    const entry = await entryFromPath(childFull, childRel);
    if (entry) entries.push(entry);
  }

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    path: normalized,
    entries,
    breadcrumbs: buildBreadcrumbs(normalized),
    writable: isWritableRelPath(normalized),
  };
}

export async function readResourceFile(
  relPath: string
): Promise<{ content: Buffer; mime: string; name: string }> {
  const normalized = assertReadablePath(relPath);
  const full = resolveFullPath(normalized);

  const stat = await fs.stat(full).catch(() => null);
  if (!stat?.isFile()) throw new ResourcePathError("File not found", 404);

  const content = await fs.readFile(full);
  const name = path.basename(full);
  return { content, mime: mimeForFile(name), name };
}

export async function readResourceText(relPath: string): Promise<{
  text: string;
  mime: string;
  name: string;
}> {
  const { content, mime, name } = await readResourceFile(relPath);
  if (!isTextMime(mime)) {
    throw new ResourcePathError("File is not text-readable", 415);
  }
  return { text: content.toString("utf-8"), mime, name };
}

export async function writeResourceFile(
  relPath: string,
  buffer: Buffer
): Promise<ResourceEntry> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ResourcePathError("File exceeds 10 MB limit");
  }

  const normalized = assertWritablePath(relPath);
  const full = resolveFullPath(normalized);
  const name = path.basename(full);
  sanitizeFilename(name);

  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);

  const stat = await fs.stat(full);
  return {
    name,
    path: normalized,
    type: "file",
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    mime: mimeForFile(name),
  };
}

export async function deleteResourceFile(relPath: string): Promise<void> {
  const normalized = assertWritablePath(relPath);
  const full = resolveFullPath(normalized);

  const stat = await fs.stat(full).catch(() => null);
  if (!stat?.isFile()) throw new ResourcePathError("File not found", 404);

  await fs.unlink(full);
}

export function isBinaryPreviewMime(mime: string): boolean {
  return mime.startsWith("image/") || mime === "application/pdf";
}
