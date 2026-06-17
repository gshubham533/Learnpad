"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { UiBlock } from "@/agent/lib/schemas";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicBlock } from "@/components/DynamicBlock";
import { MarkdownContent } from "@/components/MarkdownContent";

export function DashboardSection() {
  const { state, isRunning } = useAgentStatus(3000);
  const [blocks, setBlocks] = useState<UiBlock[]>([]);

  const refreshBlocks = useCallback(async () => {
    const res = await fetch("/api/ui-blocks");
    const data = await res.json();
    setBlocks(data.blocks ?? []);
  }, []);

  useEffect(() => {
    refreshBlocks();
    const interval = setInterval(refreshBlocks, 3000);
    return () => clearInterval(interval);
  }, [refreshBlocks]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your progress</h2>
          <div className="text-muted-foreground">
            <MarkdownContent
              content={state?.goal || "Complete setup to set your goal"}
              compact
            />
          </div>
        </div>
        <Link
          href="/activity"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {isRunning ? "Agent is working — view activity →" : "View agent activity →"}
        </Link>
      </div>

      {blocks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <DynamicBlock key={block.id} block={block} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No progress blocks yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start the agent from the chat quick actions. Progress will show up here as you work toward your goal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
