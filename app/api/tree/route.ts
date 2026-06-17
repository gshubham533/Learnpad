import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { REPO_ROOT } from "@/agent/lib/paths";

const ALLOWED = new Set([
  "app",
  "agent",
  "components",
  "state",
  "lib",
  "AGENT.md",
  "README.md",
  "package.json",
]);

const HIDDEN = new Set([
  "node_modules",
  ".next",
  ".git",
  "secrets.local.json",
  ".env",
  ".env.local",
]);

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

async function buildTree(
  dirPath: string,
  relPath: string,
  depth: number
): Promise<TreeNode | null> {
  if (depth > 3) return null;

  const name = path.basename(dirPath);
  if (HIDDEN.has(name)) return null;

  const stat = await fs.stat(dirPath).catch(() => null);
  if (!stat) return null;

  if (stat.isFile()) {
    return { name, path: relPath, type: "file" };
  }

  const entries = await fs.readdir(dirPath).catch(() => []);
  const children: TreeNode[] = [];

  for (const entry of entries.sort()) {
    if (HIDDEN.has(entry)) continue;
    const childPath = path.join(dirPath, entry);
    const childRel = relPath ? `${relPath}/${entry}` : entry;
    const node = await buildTree(childPath, childRel, depth + 1);
    if (node) children.push(node);
  }

  return { name, path: relPath, type: "dir", children };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const previewPath = searchParams.get("preview");

  if (previewPath) {
    const safe = previewPath.replace(/\.\./g, "");
    const full = path.join(REPO_ROOT, safe);
    if (!full.startsWith(REPO_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    try {
      const content = await fs.readFile(full, "utf-8");
      return NextResponse.json({ content: content.split("\n").slice(0, 200).join("\n") });
    } catch {
      return NextResponse.json({ error: "Cannot read file" }, { status: 404 });
    }
  }

  const roots: TreeNode[] = [];
  for (const entry of ALLOWED) {
    const full = path.join(REPO_ROOT, entry);
    const node = await buildTree(full, entry, 0);
    if (node) roots.push(node);
  }

  return NextResponse.json({ tree: roots });
}
