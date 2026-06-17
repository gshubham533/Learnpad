"use client";

import { extractFileRefs } from "@/lib/parseFileRefs";
import { cn } from "@/lib/utils";

export function TextWithFileRefs({
  text,
  className,
  onFileSelect,
}: {
  text: string;
  className?: string;
  onFileSelect?: (path: string) => void;
}) {
  if (!text?.trim()) return null;

  const refs = extractFileRefs(text);
  if (!refs.length || !onFileSelect) {
    return <span className={className}>{text}</span>;
  }

  const pattern = /(state\/(?:product|resources)\/[\w./_-]+)/g;
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (refs.includes(part.replace(/[.,;:!?)]+$/, ""))) {
          const clean = part.replace(/[.,;:!?)]+$/, "");
          const suffix = part.slice(clean.length);
          return (
            <span key={`${part}-${i}`}>
              <button
                type="button"
                onClick={() => onFileSelect(clean)}
                className="font-medium text-primary underline hover:text-primary/80"
              >
                {clean}
              </button>
              {suffix}
            </span>
          );
        }
        return <span key={`${part}-${i}`}>{part}</span>;
      })}
    </span>
  );
}

export function lineClassForKind(kind: string, live?: boolean) {
  return cn(
    "min-w-0 flex-1 break-words",
    live && "animate-pulse",
    kind === "thinking" && "italic text-muted-foreground",
    kind === "status" && "text-muted-foreground",
    kind === "tool" && "font-mono text-xs text-muted-foreground",
    kind === "error" && "text-destructive"
  );
}
