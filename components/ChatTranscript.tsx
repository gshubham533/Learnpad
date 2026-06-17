"use client";

import { useEffect, useRef } from "react";
import type { StreamEvent } from "@/agent/lib/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageBubble,
  type DisplayMessage,
} from "@/components/MessageBubble";

function groupEvents(events: StreamEvent[]): DisplayMessage[] {
  const result: DisplayMessage[] = [];

  for (const e of events) {
    const last = result[result.length - 1];

    if (e.type === "assistant") {
      if (last?.kind === "assistant") {
        last.text += e.text ?? "";
      } else {
        result.push({ id: e.ts, kind: "assistant", text: e.text ?? "" });
      }
      continue;
    }

    if (e.type === "user") {
      if (last?.kind === "user") {
        last.text += e.text ?? "";
      } else {
        result.push({ id: e.ts, kind: "user", text: e.text ?? "" });
      }
      continue;
    }

    if (e.type === "thinking") {
      if (last?.kind === "thinking") {
        last.text += e.text ?? "";
      } else {
        result.push({ id: e.ts, kind: "thinking", text: e.text ?? "" });
      }
      continue;
    }

    if (e.type === "tool_call") {
      if (last?.kind === "tool_call") {
        last.tools.push(e.tool ?? "tool");
      } else {
        result.push({ id: e.ts, kind: "tool_call", tools: [e.tool ?? "tool"] });
      }
      continue;
    }

    if (e.type === "error") {
      result.push({ id: e.ts, kind: "error", text: e.text ?? "" });
    }
  }

  return result;
}

export function ChatTranscript({
  events,
  isRunning,
  emptyMessage,
  hideInternalEvents,
}: {
  events: StreamEvent[];
  isRunning: boolean;
  emptyMessage?: string;
  hideInternalEvents?: boolean;
}) {
  const filtered = hideInternalEvents
    ? events.filter((e) => e.type === "user" || e.type === "assistant" || e.type === "error")
    : events;
  const messages = groupEvents(filtered);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isRunning]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {emptyMessage ?? "Send a message to start chatting with Cursor."}
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isRunning && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Agent is working…
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
