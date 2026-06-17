"use client";

import type { ChatSession } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <Button onClick={onNew} className="w-full" size="sm">
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {sessions.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">No chats yet</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                activeId === s.id ? "bg-accent font-medium" : ""
              }`}
            >
              <div className="truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {s.status === "running" ? "running…" : new Date(s.last_message_at).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
