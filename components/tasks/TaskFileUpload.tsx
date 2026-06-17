"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ACCEPT = ".md,.txt,.json,.pdf,.png,.jpg,.jpeg,.webp,.csv,.doc,.docx";

export function TaskFileUpload({
  taskId,
  fileHint,
  onUploaded,
}: {
  taskId: string;
  fileHint?: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("taskId", taskId);
      form.append("file", file);
      const res = await fetch("/api/questions/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success(`Uploaded ${json.path}`);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3">
      <p className="text-sm font-medium">Upload a file</p>
      {fileHint && <p className="text-xs text-muted-foreground">{fileHint}</p>}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        aria-label="Upload file for task"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploading ? "Uploading…" : "Choose file"}
      </Button>
    </div>
  );
}
