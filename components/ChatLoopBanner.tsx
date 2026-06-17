"use client";

import Link from "next/link";
import type { LoopContext } from "@/agent/lib/schemas";
import { MarkdownContent } from "@/components/MarkdownContent";

export function ChatLoopBanner({ loop }: { loop: LoopContext | null }) {
  if (!loop) return null;

  const blocking = loop.blocking_task_count > 0;
  const optional = loop.optional_task_count > 0;

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

      {blocking && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <strong>Action required.</strong>{" "}
          {loop.blocking_task_count} blocking task(s) — the agent is paused until you respond.{" "}
          <Link href="/activity#tasks" className="font-medium text-primary underline">
            Go to Your tasks →
          </Link>
        </div>
      )}

      {!blocking && optional && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <strong className="text-foreground">Optional tasks available.</strong>{" "}
          {loop.optional_task_count} preference/setup task(s) — the agent keeps building.{" "}
          <Link href="/activity#tasks" className="font-medium text-primary underline">
            Answer when ready →
          </Link>
        </div>
      )}

      {!blocking && !optional && loop.status === "waiting_for_user" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <strong>The agent is paused.</strong>{" "}
          <Link href="/activity#tasks" className="font-medium text-primary underline">
            Check Your tasks →
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
