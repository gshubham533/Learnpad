"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { linkifyFileRefs } from "@/lib/parseFileRefs";

export function MarkdownWithFileRefs({
  content,
  className,
  compact,
  onFileSelect,
}: {
  content: string;
  className?: string;
  compact?: boolean;
  onFileSelect?: (path: string) => void;
}) {
  if (!content?.trim()) return null;

  const processed = onFileSelect ? linkifyFileRefs(content) : content;

  return (
    <div
      className={cn(
        "prose-chat",
        compact && "prose-xs [&_pre]:text-xs [&_code]:text-xs",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("file://") && onFileSelect) {
              const filePath = href.replace("file://", "");
              return (
                <button
                  type="button"
                  onClick={() => onFileSelect(filePath)}
                  className="text-left font-medium text-primary underline hover:text-primary/80"
                >
                  {children}
                </button>
              );
            }
            if (href?.startsWith("/")) {
              return (
                <a href={href} className="text-primary underline">
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
