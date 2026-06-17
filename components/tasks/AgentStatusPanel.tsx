"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AgentPause, AppState } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/MarkdownContent";

interface HealthResponse {
  health: string;
  pause: AgentPause;
  state: AppState;
  process: { status: string; pid: number | null };
  lastActivityAt: string | null;
  taskSummary?: string;
}

function pauseBadge(kind: AgentPause["kind"]) {
  switch (kind) {
    case "user_input":
      return <Badge variant="secondary">Your input</Badge>;
    case "external_wait":
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300">External wait</Badge>;
    case "system_error":
      return <Badge variant="destructive">System issue</Badge>;
    case "stuck":
      return <Badge variant="destructive">Stuck</Badge>;
    default:
      return null;
  }
}

export function AgentStatusPanel() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agent-health");
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function restartAgent() {
    setRestarting(true);
    try {
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
    } finally {
      setRestarting(false);
    }
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Loading agent status…
        </CardContent>
      </Card>
    );
  }

  const { health, pause, state, process, lastActivityAt, taskSummary } = data;
  const showPause = pause.kind !== "none";
  const isRunning = health === "running" && process.status === "running";
  const isStuck = health === "stuck" || pause.kind === "stuck";
  const isError = health === "error" || state.status === "error";
  const isWaiting = health === "waiting_for_user" || pause.kind === "user_input" || pause.kind === "external_wait";
  const workingOn = taskSummary || state.next_action;

  return (
    <Card
      className={cn(
        "border",
        isRunning && "border-primary/30 bg-primary/5",
        isWaiting && !isStuck && !isError && "border-amber-500/30 bg-amber-500/5",
        pause.kind === "external_wait" && "border-blue-500/30 bg-blue-500/5",
        (isStuck || isError) && "border-destructive/30 bg-destructive/5"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">What&apos;s happening</CardTitle>
          <div className="flex items-center gap-2">
            {showPause && pauseBadge(pause.kind)}
            <Badge variant="outline" className="capitalize">
              {state.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isRunning && !showPause && (
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">Agent is working.</p>
              <MarkdownContent content={workingOn} compact />
            </div>
          </div>
        )}

        {!isRunning && !showPause && state.status === "idle" && (
          <p className="text-muted-foreground">
            Agent is idle. Start it from quick actions on Home or below when a task needs attention.
          </p>
        )}

        {showPause && (
          <div className="space-y-2">
            {pause.title && <MarkdownContent content={pause.title} />}
            {pause.summary && <MarkdownContent content={pause.summary} compact />}
            {pause.detail && (
              <MarkdownContent content={pause.detail} compact className="text-muted-foreground" />
            )}
            {pause.next_when && (
              <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                <span className="font-medium text-foreground">Once we have input: </span>
                <MarkdownContent content={pause.next_when} compact className="mt-1" />
              </div>
            )}
            {pause.kind === "external_wait" && (
              <p className="text-xs text-muted-foreground">
                This is an intentional pause — waiting on something outside the app (e.g. community replies).
              </p>
            )}
          </div>
        )}

        {lastActivityAt && (
          <p className="text-xs text-muted-foreground">
            Last activity: {new Date(lastActivityAt).toLocaleString()}
            {process.pid ? ` · process ${process.pid}` : ""}
          </p>
        )}

        {(isStuck || isError) && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={restartAgent} disabled={restarting}>
              {restarting ? "Starting…" : "Restart agent"}
            </Button>
            <Link
              href="/activity"
              className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm hover:bg-muted"
            >
              View activity
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
