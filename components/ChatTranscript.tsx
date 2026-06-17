"use client";

import type { StreamEvent } from "@/agent/lib/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function ChatTranscript({
  events,
  isRunning,
}: {
  events: StreamEvent[];
  isRunning: boolean;
}) {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {events.length === 0 && (
          <p className="text-center text-muted-foreground">
            Send a message to start chatting with Cursor.
          </p>
        )}
        {events.map((e, i) => (
          <div
            key={`${e.ts}-${i}`}
            className={`rounded-lg p-3 ${
              e.type === "user"
                ? "ml-8 bg-primary/10"
                : e.type === "error"
                  ? "bg-red-500/10"
                  : "mr-8 bg-muted"
            }`}
          >
            {e.type === "user" && <p className="whitespace-pre-wrap">{e.text}</p>}
            {e.type === "assistant" && <p className="whitespace-pre-wrap">{e.text}</p>}
            {e.type === "thinking" && (
              <p className="text-sm italic text-muted-foreground">{e.text?.slice(0, 300)}</p>
            )}
            {e.type === "tool_call" && (
              <Badge className="bg-muted text-muted-foreground">{e.tool ?? "tool"}</Badge>
            )}
            {e.type === "error" && <p className="text-red-600">{e.text}</p>}
          </div>
        ))}
        {isRunning && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Agent is working…
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
