"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownContent } from "@/components/MarkdownContent";

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const [preview, setPreview] = useState<string | null>(null);

  async function showPreview() {
    if (node.type !== "file") return;
    const res = await fetch(`/api/tree?preview=${encodeURIComponent(node.path)}`);
    const data = await res.json();
    setPreview(data.content ?? data.error);
  }

  if (node.type === "file") {
    return (
      <div style={{ paddingLeft: depth * 12 }} className="py-0.5">
        <button
          onClick={showPreview}
          className="text-left text-sm text-primary hover:underline"
        >
          📄 {node.name}
        </button>
        {preview && (
          <div className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2">
            <MarkdownContent content={preview} compact />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <button
        onClick={() => setOpen(!open)}
        className="py-0.5 text-sm font-medium"
      >
        {open ? "📂" : "📁"} {node.name}
        {node.children && (
          <span className="ml-1 text-muted-foreground">({node.children.length})</span>
        )}
      </button>
      {open &&
        node.children?.map((child) => (
          <TreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function FileTreePanel() {
  const [tree, setTree] = useState<TreeNode[]>([]);

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((d) => setTree(d.tree ?? []));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project files</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {tree.map((node) => (
            <TreeItem key={node.path} node={node} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
