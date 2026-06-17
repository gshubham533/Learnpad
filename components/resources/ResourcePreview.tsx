"use client";

import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PreviewData {
  path: string;
  name: string;
  mime: string;
  encoding: "utf-8" | "base64";
  content: string;
}

export function ResourcePreview({
  path,
  writable,
  onDeleted,
}: {
  path: string | null;
  writable: boolean;
  onDeleted: () => void;
}) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!path) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/resources?path=${encodeURIComponent(path)}&mode=content`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load preview");
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  async function handleDelete() {
    if (!path || !writable) return;
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resources?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (!path) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center p-4 text-sm text-muted-foreground">
        Select a file to preview
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="truncate text-sm font-medium">{path.split("/").pop()}</p>
        <div className="flex shrink-0 gap-1">
          <a
            href={`/api/resources?path=${encodeURIComponent(path)}&mode=download`}
            download
            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent"
            title="Download"
          >
            <Download className="size-4" />
          </a>
          {writable && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {loading && <p className="text-sm text-muted-foreground">Loading preview…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data && <PreviewBody data={data} />}
      </ScrollArea>
    </div>
  );
}

function PreviewBody({ data }: { data: PreviewData }) {
  if (data.encoding === "base64") {
    const src = `data:${data.mime};base64,${data.content}`;
    if (data.mime.startsWith("image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={data.name} className="max-h-[60vh] rounded-md object-contain" />
      );
    }
    if (data.mime === "application/pdf") {
      return (
        <iframe
          src={src}
          title={data.name}
          className="h-[60vh] w-full rounded-md border border-border"
        />
      );
    }
    return <p className="text-sm text-muted-foreground">Binary file — use Download to open.</p>;
  }

  if (data.mime === "application/json") {
    let formatted = data.content;
    try {
      formatted = JSON.stringify(JSON.parse(data.content), null, 2);
    } catch {
      /* keep raw */
    }
    return (
      <pre className={cn("overflow-x-auto text-xs leading-relaxed")}>
        <code>{formatted}</code>
      </pre>
    );
  }

  if (data.mime === "text/markdown") {
    return <MarkdownContent content={data.content} />;
  }

  return (
    <pre className="whitespace-pre-wrap text-sm">
      <code>{data.content}</code>
    </pre>
  );
}
