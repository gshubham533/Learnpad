"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".md,.txt,.json,.pdf,.png,.jpg,.jpeg,.webp,.csv";

export function ResourceUploadZone({
  folder,
  disabled,
  onUploaded,
}: {
  folder: string;
  disabled?: boolean;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    if (disabled) {
      toast.error("This folder is read-only");
      return;
    }

    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    let ok = 0;
    for (const file of list) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      try {
        const res = await fetch("/api/resources", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        ok++;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(ok === 1 ? "File uploaded" : `${ok} files uploaded`);
      onUploaded();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept={ACCEPT}
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploading ? "Uploading…" : "Upload"}
      </Button>
      <div
        className={cn(
          "hidden flex-1 rounded-lg border border-dashed border-border px-4 py-2 text-center text-xs text-muted-foreground lg:block",
          dragging && "border-primary bg-primary/5",
          disabled && "opacity-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files.length) {
            uploadFiles(e.dataTransfer.files);
          }
        }}
      >
        Drop files here (max 10 MB)
      </div>
    </div>
  );
}
