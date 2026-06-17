"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveActivityPanel } from "@/components/LiveActivityPanel";
import { LiveProgressFeed } from "@/components/LiveProgressFeed";
import { FileTreePanel } from "@/components/FileTreePanel";
import { MarkdownContent } from "@/components/MarkdownContent";

function StatusHero({
  status,
  isRunning,
  nextAction,
}: {
  status: string;
  isRunning: boolean;
  nextAction?: string;
}) {
  const showProgress = isRunning || status === "running";

  const statusCard = (() => {
    if (isRunning || status === "running") {
      return (
        <div className="flex h-full items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <span className="relative flex h-4 w-4 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Agent is working…</h2>
            <p className="text-muted-foreground">Building toward your goal in the background</p>
            {nextAction && (
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{nextAction}</p>
            )}
          </div>
        </div>
      );
    }

    if (status === "waiting_for_user") {
      return (
        <div className="h-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="text-xl font-semibold">Waiting for you</h2>
          <p className="mt-1 text-muted-foreground">
            The agent needs your input to continue.{" "}
            <Link href="/tasks" className="font-medium text-primary underline">
              Go to Your tasks
            </Link>
          </p>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="h-full rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-xl font-semibold">Something needs attention</h2>
          <p className="mt-1 text-muted-foreground">
            <MarkdownContent content={nextAction ?? ""} compact />
          </p>
        </div>
      );
    }

    return (
      <div className="h-full rounded-xl border border-border bg-muted/50 p-6">
        <h2 className="text-xl font-semibold">Agent is idle</h2>
        <p className="mt-1 text-muted-foreground">Click Start to kick off the next step</p>
      </div>
    );
  })();

  if (showProgress) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {statusCard}
        <LiveProgressFeed isRunning={isRunning || status === "running"} />
      </div>
    );
  }

  return statusCard;
}

export default function ActivityPage() {
  const { state, isRunning, nextPrompt, loading, handleControl } = useAgentStatus(3000);
  const [journal, setJournal] = useState("");

  const refreshJournal = useCallback(async () => {
    const res = await fetch("/api/journal");
    const data = await res.json();
    setJournal(data.journal ?? "");
  }, []);

  useEffect(() => {
    refreshJournal();
    const interval = setInterval(refreshJournal, 3000);
    return () => clearInterval(interval);
  }, [refreshJournal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">What&apos;s Happening</h1>
          <p className="text-muted-foreground">Live view of what the agent is doing right now</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{state?.phase ?? "—"}</Badge>
          <Badge className="capitalize">{state?.status ?? "idle"}</Badge>
          <Badge variant="secondary">loop {state?.loop_count ?? 0}</Badge>
          {isRunning ? (
            <Button variant="destructive" disabled={loading} onClick={() => handleControl("stop")}>
              Stop
            </Button>
          ) : (
            <Button disabled={loading} onClick={() => handleControl("start")}>
              Start
            </Button>
          )}
        </div>
      </div>

      <StatusHero
        status={state?.status ?? "idle"}
        isRunning={isRunning}
        nextAction={state?.next_action}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MarkdownContent content={state?.next_action ?? ""} />
          <div className="max-h-48 overflow-auto rounded-md bg-muted p-4">
            <MarkdownContent content={nextPrompt || "Loading…"} compact />
          </div>
        </CardContent>
      </Card>

      <LiveActivityPanel isRunning={isRunning} tall />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What&apos;s been done</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto">
            <MarkdownContent
              content={
                journal.split("\n").reverse().join("\n").slice(0, 4000) ||
                "No journal entries yet."
              }
              compact
            />
          </CardContent>
        </Card>

        <FileTreePanel />
      </div>
    </div>
  );
}
