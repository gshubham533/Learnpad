"use client";

import { useEffect, useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { isEditableResourceMime } from "@/lib/resource-display";

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
  editMode,
  onEditModeChange,
  onDeleted,
  onSaved,
}: {
  path: string | null;
  writable: boolean;
  editMode?: boolean;
  onEditModeChange?: (edit: boolean) => void;
  onDeleted: () => void;
  onSaved?: () => void;
}) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editable =
    writable && data?.encoding === "utf-8" && isEditableResourceMime(data.mime);
  const dirty = editable && draft !== data?.content;

  useEffect(() => {
    if (!path) {
      setData(null);
      setDraft("");
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
        if (!cancelled) {
          setData(json);
          if (json.encoding === "utf-8") setDraft(json.content);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setDraft("");
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

  async function handleSave() {
    if (!path || !editable) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setData((prev) => (prev ? { ...prev, content: draft } : prev));
      onEditModeChange?.(false);
      onSaved?.();
      toast.success("File saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (data?.encoding === "utf-8") setDraft(data.content);
    onEditModeChange?.(false);
  }

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
        <p className="truncate text-sm font-medium">
          {editMode ? "Editing" : "Preview"} · {path.split("/").pop()}
        </p>
        <div className="flex shrink-0 gap-1">
          {editable && !editMode && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEditModeChange?.(true)}
              title="Edit file"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {!editMode && (
            <a
              href={`/api/resources?path=${encodeURIComponent(path)}&mode=download`}
              download
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent"
              title="Download"
            >
              <Download className="size-4" />
            </a>
          )}
          {writable && !editMode && (
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

      {editMode && editable && (
        <div className="flex items-center justify-end gap-2 border-b border-border px-3 py-2">
          <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-3">
        {loading && <p className="text-sm text-muted-foreground">Loading preview…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data && editMode && editable ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[50vh] font-mono text-xs leading-relaxed"
            spellCheck={data.mime === "text/markdown"}
          />
        ) : (
          data && <PreviewBody data={data} />
        )}
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
