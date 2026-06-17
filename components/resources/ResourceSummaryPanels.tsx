"use client";

import { useEffect, useState } from "react";
import { FilePlus, FilePen, FileX, FileText, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ResourceChange, ResourceEntry, ResourceSummary } from "@/agent/lib/resources";
import { humanizeResourceName } from "@/lib/resource-display";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionMeta(action: ResourceChange["action"]) {
  switch (action) {
    case "created":
      return {
        label: "Created",
        icon: FilePlus,
        className: "text-emerald-600",
      };
    case "modified":
      return {
        label: "Modified",
        icon: FilePen,
        className: "text-amber-600",
      };
    case "deleted":
      return {
        label: "Deleted",
        icon: FileX,
        className: "text-destructive",
      };
  }
}

export function ResourceSummaryPanels({
  refreshToken = 0,
  onOpenDocument,
  onEditDocument,
}: {
  refreshToken?: number;
  onOpenDocument: (entry: ResourceEntry) => void;
  onEditDocument: (entry: ResourceEntry) => void;
}) {
  const [summary, setSummary] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/resources?mode=summary");
        const data: ResourceSummary = await res.json();
        if (!cancelled && res.ok) setSummary(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const productDocs =
    summary?.documents.filter((doc) => doc.path.startsWith("state/product/")) ?? [];
  const uploadDocs =
    summary?.documents.filter((doc) => doc.path.startsWith("state/resources/")) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agent documents</CardTitle>
          <CardDescription>
            Launch assets and docs created for your agency ({productDocs.length} files).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          ) : productDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent documents yet.</p>
          ) : (
            <ScrollArea className="h-[220px] pr-3">
              <ul className="space-y-1">
                {productDocs.map((doc) => (
                  <li key={doc.path}>
                    <div className="flex items-start gap-1 rounded-md px-1 py-1 hover:bg-accent">
                      <button
                        type="button"
                        onClick={() => onOpenDocument(doc)}
                        className="flex min-w-0 flex-1 items-start gap-2 px-1 py-0.5 text-left text-sm"
                      >
                        <FileText className="mt-0.5 size-4 shrink-0 text-blue-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{humanizeResourceName(doc.name)}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {doc.path.replace(/^state\//, "")}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {doc.modifiedAt ? formatWhen(doc.modifiedAt) : ""}
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        title="Edit file"
                        onClick={() => onEditDocument(doc)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          {!loading && uploadDocs.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Plus {uploadDocs.length} uploaded file{uploadDocs.length === 1 ? "" : "s"} in{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() =>
                  onOpenDocument({
                    name: "resources",
                    path: "state/resources",
                    type: "dir",
                  })
                }
              >
                state/resources
              </button>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>
            Created, modified, and deleted files — newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading activity…</p>
          ) : !summary?.changes.length ? (
            <p className="text-sm text-muted-foreground">No file changes recorded yet.</p>
          ) : (
            <ScrollArea className="h-[220px] pr-3">
              <ul className="space-y-1">
                {summary.changes.map((change, index) => {
                  const meta = actionMeta(change.action);
                  const Icon = meta.icon;
                  const openable = change.action !== "deleted";
                  return (
                    <li key={`${change.path}-${change.at}-${index}`}>
                      <button
                        type="button"
                        disabled={!openable}
                        onClick={() => {
                          if (!openable) return;
                          onOpenDocument({
                            name: change.name,
                            path: change.path,
                            type: "file",
                          });
                        }}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                          openable ? "hover:bg-accent" : "opacity-70"
                        )}
                      >
                        <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} />
                        <span className="min-w-0 flex-1">
                          <span className="block">
                            <span className={cn("font-medium", meta.className)}>{meta.label}</span>
                            <span className="text-muted-foreground"> · </span>
                            <span className="font-medium">{humanizeResourceName(change.name)}</span>
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {change.path.replace(/^state\//, "")}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatWhen(change.at)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
