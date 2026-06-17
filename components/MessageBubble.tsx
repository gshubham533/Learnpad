"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MessageKind = "user" | "assistant" | "thinking" | "tool_call" | "error";

export type DisplayMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "thinking"; text: string }
  | { id: string; kind: "tool_call"; tools: string[] }
  | { id: string; kind: "error"; text: string };

function bubbleStyles(kind: MessageKind) {
  switch (kind) {
    case "user":
      return "ml-8 bg-primary/10 border border-primary/20";
    case "error":
      return "bg-destructive/10 border border-destructive/20";
    case "thinking":
      return "mr-8 bg-muted/50 border border-border/50";
    default:
      return "mr-8 bg-card border border-border shadow-sm";
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        onClick={handleCopy}
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </TooltipTrigger>
      <TooltipContent>Copy</TooltipContent>
    </Tooltip>
  );
}

function TextBubble({
  text,
  compact,
  className,
}: {
  text: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("pr-8", className)}>
      <MarkdownContent content={text} compact={compact} />
    </div>
  );
}

export function MessageBubble({ message }: { message: DisplayMessage }) {
  const canCopy =
    message.kind === "user" ||
    message.kind === "assistant" ||
    message.kind === "error";

  return (
    <div
      className={cn(
        "group relative rounded-xl p-4",
        bubbleStyles(message.kind)
      )}
    >
      {canCopy && (
        <div className="absolute right-2 top-2">
          <CopyButton text={message.text} />
        </div>
      )}

      {message.kind === "user" && <TextBubble text={message.text} />}
      {message.kind === "assistant" && <TextBubble text={message.text} />}
      {message.kind === "thinking" && (
        <TextBubble
          text={message.text}
          compact
          className="italic text-muted-foreground [&_.prose-chat]:text-muted-foreground"
        />
      )}
      {message.kind === "tool_call" && (
        <div className="flex flex-wrap gap-1">
          {message.tools.map((tool) => (
            <Badge key={tool} variant="secondary">
              {tool}
            </Badge>
          ))}
        </div>
      )}
      {message.kind === "error" && (
        <TextBubble
          text={message.text}
          className="[&_.prose-chat]:text-destructive"
        />
      )}
    </div>
  );
}
