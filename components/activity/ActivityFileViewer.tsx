"use client";

import { X } from "lucide-react";
import { ResourcePreview } from "@/components/resources/ResourcePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityFileViewer({
  path,
  onClose,
}: {
  path: string | null;
  onClose: () => void;
}) {
  if (!path) return null;

  return (
    <Card id="file-viewer" className="scroll-mt-4" aria-live="polite">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="truncate text-base font-medium">{path}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close file preview"
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-[32rem] min-h-[12rem] overflow-hidden rounded-md border border-border">
          <ResourcePreview
            path={path}
            writable={false}
            onDeleted={onClose}
          />
        </div>
      </CardContent>
    </Card>
  );
}
