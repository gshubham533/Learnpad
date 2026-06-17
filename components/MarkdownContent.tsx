"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

export function MarkdownContent({
  content,
  className,
  compact,
}: {
  content: string;
  className?: string;
  /** Smaller typography for logs, side panels, and inline areas */
  compact?: boolean;
}) {
  if (!content?.trim()) return null;

  return (
    <div
      className={cn(
        "prose-chat",
        compact && "prose-xs [&_pre]:text-xs [&_code]:text-xs",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
