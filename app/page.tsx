"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppState } from "@/agent/lib/schemas";
import type { UiBlock } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicBlock } from "@/components/DynamicBlock";
import { LiveActivityPanel } from "@/components/LiveActivityPanel";
import { FileTreePanel } from "@/components/FileTreePanel";

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [processStatus, setProcessStatus] = useState<string>("stopped");
  const [journal, setJournal] = useState("");
  const [nextPrompt, setNextPrompt] = useState("");
  const [blocks, setBlocks] = useState<UiBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [controlRes, stateRes, journalRes, blocksRes, nextRes] = await Promise.all([
      fetch("/api/control"),
      fetch("/api/state"),
      fetch("/api/journal"),
      fetch("/api/ui-blocks"),
      fetch("/api/next-prompt"),
    ]);

    const control = await controlRes.json();
    const st = await stateRes.json();
    const j = await journalRes.json();
    const b = await blocksRes.json();
    const np = await nextRes.json();

    setProcessStatus(control.process?.status ?? "stopped");
    setState(st);
    setJournal(j.journal ?? "");
    setBlocks(b.blocks ?? []);
    setNextPrompt(np.content ?? "");
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const isRunning = processStatus === "running" || state?.status === "running";

  async function handleControl(action: "start" | "stop") {
    setLoading(true);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "start") {
        toast.success(data.alreadyRunning ? "Agent already running" : "Agent started");
      } else {
        toast.success("Agent stopped");
      }
      await refresh();
    } catch {
      toast.error("Control action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {state?.goal || "Complete setup to set your goal"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{state?.phase ?? "—"}</Badge>
          <Badge className="capitalize">{state?.status ?? "idle"}</Badge>
          <Badge>loop {state?.loop_count ?? 0}</Badge>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Working on now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{state?.next_action}</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {nextPrompt || "Loading…"}
            </pre>
          </CardContent>
        </Card>

        <LiveActivityPanel isRunning={isRunning} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What&apos;s been done</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-sm">
              {journal.split("\n").reverse().join("\n").slice(0, 4000)}
            </pre>
          </CardContent>
        </Card>

        <FileTreePanel />
      </div>

      {blocks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <DynamicBlock key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
