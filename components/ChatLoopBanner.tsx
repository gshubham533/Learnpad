"use client";

import Link from "next/link";
import type { LoopContext } from "@/agent/lib/schemas";
import { MarkdownContent } from "@/components/MarkdownContent";

export function ChatLoopBanner({ loop }: { loop: LoopContext | null }) {
  if (!loop) return null;

  const hasTasks = loop.pending_tasks.length > 0;
  const waiting =
    loop.status === "waiting_for_user" || loop.questions_pending || hasTasks;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        {loop.process_running || loop.status === "running" ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <strong>Build agent:</strong> {loop.status.replace(/_/g, " ")}
          {loop.process_running ? " (process active)" : ""}
          {" · "}
          <MarkdownContent content={loop.next_action} compact className="mt-0.5" />
        </span>
        <Link href="/activity" className="ml-auto font-medium text-primary underline">
          What&apos;s Happening →
        </Link>
      </div>

      {waiting && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <strong>Your input is needed.</strong>{" "}
          {hasTasks
            ? `${loop.pending_tasks.length} task(s) waiting.`
            : "The agent is paused until you respond."}{" "}
          <Link href="/tasks" className="font-medium text-primary underline">
            Go to Your tasks →
          </Link>
        </div>
      )}

      {loop.status === "error" && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          <strong>Agent error.</strong>{" "}
          <MarkdownContent content={loop.next_action} compact className="mt-1" />
          <Link href="/activity" className="mt-1 inline-block font-medium text-primary underline">
            See details →
          </Link>
        </div>
      )}
    </div>
  );
}
