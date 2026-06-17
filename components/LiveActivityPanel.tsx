"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamEvent } from "@/agent/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LiveActivityPanel({ isRunning }: { isRunning: boolean }) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "loop" | "chat">("all");
  const lastTs = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function poll() {
      const params = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : "";
      const res = await fetch(`/api/live${params}`);
      const data = await res.json();
      if (!active) return;
      if (data.events?.length) {
        setEvents((prev) => {
          const merged = [...prev, ...data.events];
          return merged.slice(-200);
        });
        lastTs.current = data.events[data.events.length - 1].ts;
      }
    }

    poll();
    const interval = setInterval(poll, isRunning ? 1500 : 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isRunning]);

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
        <ScrollArea className="h-64 rounded-md border border-border p-3 font-mono text-xs">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No activity yet. Start the agent or send a chat.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((e, i) => (
                <div key={`${e.ts}-${i}`}>
                  {e.type === "thinking" && (
                    <p className="text-muted-foreground italic">thinking… {e.text?.slice(0, 120)}</p>
                  )}
                  {e.type === "tool_call" && (
                    <Badge className="bg-accent text-accent-foreground">{e.tool ?? "tool"}</Badge>
                  )}
                  {e.type === "assistant" && (
                    <p className="whitespace-pre-wrap">{e.text}</p>
                  )}
                  {e.type === "user" && (
                    <p className="text-primary">you: {e.text}</p>
                  )}
                  {e.type === "status" && (
                    <p className="text-muted-foreground">— {e.text}</p>
                  )}
                  {e.type === "error" && (
                    <p className="text-red-600">error: {e.text}</p>
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
