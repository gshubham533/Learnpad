"use client";

import { useState } from "react";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function EventText({
  text,
  className,
  prefix,
}: {
  text?: string;
  className?: string;
  prefix?: string;
}) {
  if (!text?.trim()) return null;
  return (
    <div className={cn("space-y-0.5", className)}>
      {prefix && <span className="font-medium">{prefix}</span>}
      <MarkdownContent content={text} compact />
    </div>
  );
}

export function LiveActivityPanel({
  isRunning,
  tall,
}: {
  isRunning: boolean;
  tall?: boolean;
}) {
  const events = useLiveEvents({ isRunning });
  const [filter, setFilter] = useState<"all" | "loop" | "chat">("all");

  const filtered = events.filter(
    (e) => filter === "all" || e.source === filter
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Live activity</CardTitle>
        <div className="flex gap-1">
          {(["all", "loop", "chat"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-0.5 text-xs ${
                filter === f ? "bg-accent font-medium" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className={
            tall
              ? "h-[28rem] rounded-md border border-border p-3 text-sm"
              : "h-64 rounded-md border border-border p-3 text-sm"
          }
        >
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No activity yet. Start the agent or send a chat.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((e, i) => (
                <div key={`${e.ts}-${i}`} className="border-b border-border/50 pb-2 last:border-0">
                  {e.type === "thinking" && (
                    <EventText
                      text={e.text}
                      prefix="thinking…"
                      className="text-muted-foreground italic"
                    />
                  )}
                  {e.type === "tool_call" && (
                    <Badge variant="secondary">{e.tool ?? "tool"}</Badge>
                  )}
                  {e.type === "assistant" && <EventText text={e.text} />}
                  {e.type === "user" && (
                    <EventText text={e.text} prefix="you:" className="text-primary" />
                  )}
                  {e.type === "status" && (
                    <EventText text={e.text} prefix="—" className="text-muted-foreground" />
                  )}
                  {e.type === "error" && (
                    <EventText text={e.text} prefix="error:" className="text-destructive" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
