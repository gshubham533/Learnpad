"use client";

import { useEffect, useRef } from "react";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { eventsToProgressLines, type ProgressLine } from "@/lib/liveEventLines";
import { cn } from "@/lib/utils";

function ProgressLineRow({ line }: { line: ProgressLine }) {
  return (
    <div
      className={cn(
        "flex gap-2 border-b border-border/40 py-1.5 text-sm last:border-0",
        line.live && "text-foreground",
        line.kind === "thinking" && "italic text-muted-foreground",
        line.kind === "status" && "text-muted-foreground",
        line.kind === "tool" && "font-mono text-xs text-muted-foreground",
        line.kind === "error" && "text-destructive"
      )}
    >
      <span className="mt-0.5 shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
        {new Date(line.ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <p className={cn("min-w-0 flex-1 break-words", line.live && "animate-pulse")}>
        {line.kind === "tool" && <span className="text-muted-foreground">Tool · </span>}
        {line.kind === "thinking" && <span className="text-muted-foreground">Thinking · </span>}
        {line.kind === "error" && <span>Error · </span>}
        {line.text}
      </p>
    </div>
  );
}

export function LiveProgressFeed({
  isRunning,
  className,
}: {
  isRunning: boolean;
  className?: string;
}) {
  const events = useLiveEvents({ isRunning, pollMs: 1200, maxEvents: 300 });
  const lines = eventsToProgressLines(events, { source: "loop", maxLines: 16 });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines.length, lines[lines.length - 1]?.text]);

  return (
    <div
      className={cn(
        "flex min-h-[7.5rem] flex-col rounded-xl border border-border bg-muted/30 p-4",
        className
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live progress
      </p>
      <div className="max-h-44 flex-1 overflow-y-auto pr-1">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isRunning ? "Waiting for the first update…" : "No recent agent activity."}
          </p>
        ) : (
          <div>
            {lines.map((line) => (
              <ProgressLineRow key={line.id} line={line} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
