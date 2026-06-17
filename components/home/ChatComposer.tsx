"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { QuickActions, ScrollHint } from "@/components/home/QuickActions";
import { Send } from "lucide-react";

export function ChatComposer({
  prompt,
  onPromptChange,
  onSend,
  sending,
  showScrollHint,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  showScrollHint: boolean;
}) {
  return (
    <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask what the agent is doing, what's next, or whether it needs you…"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={2}
            className="min-h-[52px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            onClick={onSend}
            disabled={sending || !prompt.trim()}
            size="icon-lg"
            className="shrink-0 self-end"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <QuickActions />
        <ScrollHint visible={showScrollHint} />
      </div>
    </div>
  );
}
