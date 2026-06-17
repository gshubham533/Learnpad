"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ResourceEntry } from "@/agent/lib/resources";

interface TreeNode {
  path: string;
  name: string;
  children?: TreeNode[];
  loading?: boolean;
}

function TreeRow({
  node,
  depth,
  currentPath,
  onNavigate,
  onExpand,
}: {
  node: TreeNode;
  depth: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  onExpand: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isActive = currentPath === node.path || currentPath.startsWith(`${node.path}/`);
  const hasChildren = node.children !== undefined;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !hasChildren) onExpand(node.path);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onNavigate(node.path);
          if (!open) {
            setOpen(true);
            if (!hasChildren) onExpand(node.path);
          }
        }}
        className={cn(
          "flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm hover:bg-accent",
          isActive && "bg-accent font-medium"
        )}
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        </span>
        {open ? (
          <FolderOpen className="size-4 shrink-0 text-primary" />
        ) : (
          <Folder className="size-4 shrink-0 text-primary" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.map((child) => (
        <TreeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          currentPath={currentPath}
          onNavigate={onNavigate}
          onExpand={onExpand}
        />
      ))}
      {open && node.loading && (
        <p className="py-1 text-xs text-muted-foreground" style={{ paddingLeft: (depth + 1) * 12 + 28 }}>
          Loading…
        </p>
      )}
    </div>
  );
}

export function ResourceFolderTree({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const [root, setRoot] = useState<TreeNode>({ path: "state", name: "state", children: [] });

  const expandPath = useCallback(async (path: string) => {
    setRoot((prev) => patchNode(prev, path, { loading: true }));
    try {
      const res = await fetch(`/api/resources?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      const dirs = (data.entries ?? []).filter((e: ResourceEntry) => e.type === "dir");
      setRoot((prev) =>
        patchNode(prev, path, {
          loading: false,
          children: dirs.map((d: ResourceEntry) => ({
            path: d.path,
            name: d.name,
            children: undefined,
          })),
        })
      );
    } catch {
      setRoot((prev) => patchNode(prev, path, { loading: false, children: [] }));
    }
  }, []);

  useEffect(() => {
    expandPath("state");
  }, [expandPath]);

  return (
    <ScrollArea className="h-full min-h-[280px]">
      <TreeRow
        node={root}
        depth={0}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onExpand={expandPath}
      />
    </ScrollArea>
  );
}

function patchNode(node: TreeNode, targetPath: string, patch: Partial<TreeNode>): TreeNode {
  if (node.path === targetPath) return { ...node, ...patch };
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map((c) => patchNode(c, targetPath, patch)),
  };
}
