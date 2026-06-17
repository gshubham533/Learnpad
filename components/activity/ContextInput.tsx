"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ContextInput() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error();
      setText("");
      toast.success("Noted — agent will see this on its next step.");
    } catch {
      toast.error("Failed to send context");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="sticky bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      role="region"
      aria-label="Context for agent"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add context for the agent (won't stop the current run)…"
          aria-label="Add context for the agent"
          className="min-h-[2.5rem] flex-1 resize-none"
          rows={2}
        />
        <Button
          type="button"
          onClick={submit}
          disabled={sending || !text.trim()}
          className="shrink-0"
        >
          <Send className="size-3.5" />
          Send note
        </Button>
      </div>
      <p className="mx-auto mt-1 max-w-6xl text-xs text-muted-foreground">
        Enter to send · Shift+Enter for new line · Does not restart the agent
      </p>
    </div>
  );
}
