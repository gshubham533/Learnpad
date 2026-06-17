"use client";

import {
  File,
  FileImage,
  FileJson,
  FileText,
  Folder,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResourceEntry } from "@/agent/lib/resources";

function formatSize(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FileIcon({ entry }: { entry: ResourceEntry }) {
  if (entry.type === "dir") return <Folder className="size-5 text-primary" />;
  const mime = entry.mime ?? "";
  if (mime.startsWith("image/")) return <FileImage className="size-5 text-emerald-600" />;
  if (mime === "application/json") return <FileJson className="size-5 text-amber-600" />;
  if (mime === "text/markdown" || mime === "text/plain") {
    return <FileText className="size-5 text-blue-600" />;
  }
  return <File className="size-5 text-muted-foreground" />;
}

export function ResourceFileList({
  entries,
  selectedPath,
  viewMode,
  onViewModeChange,
  onOpen,
  onSelect,
}: {
  entries: ResourceEntry[];
  selectedPath: string | null;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onOpen: (entry: ResourceEntry) => void;
  onSelect: (entry: ResourceEntry) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onViewModeChange("grid")}
          aria-label="Grid view"
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          type="button"
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onViewModeChange("list")}
          aria-label="List view"
        >
          <List className="size-4" />
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          This folder is empty. Upload a file to get started.
        </p>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <button
              key={entry.path}
              type="button"
              onClick={() => (entry.type === "dir" ? onOpen(entry) : onSelect(entry))}
              onDoubleClick={() => onOpen(entry)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent",
                selectedPath === entry.path && "border-primary ring-1 ring-primary/30"
              )}
            >
              <FileIcon entry={entry} />
              <span className="line-clamp-2 text-sm font-medium">{entry.name}</span>
              {entry.type === "file" && (
                <span className="text-xs text-muted-foreground">
                  {formatSize(entry.size)} · {formatDate(entry.modifiedAt)}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {entries.map((entry) => (
            <button
              key={entry.path}
              type="button"
              onClick={() => (entry.type === "dir" ? onOpen(entry) : onSelect(entry))}
              onDoubleClick={() => onOpen(entry)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent",
                selectedPath === entry.path && "bg-accent"
              )}
            >
              <FileIcon entry={entry} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.name}</span>
              {entry.type === "file" && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {formatSize(entry.size)}
                </span>
              )}
              <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                {formatDate(entry.modifiedAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
