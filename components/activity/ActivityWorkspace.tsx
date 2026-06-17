"use client";

import { useCallback, useEffect, useState } from "react";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveActivityPanel } from "@/components/LiveActivityPanel";
import { LiveProgressFeed } from "@/components/LiveProgressFeed";
import { AgentStatusPanel } from "@/components/tasks/AgentStatusPanel";
import { TaskListWithBulk } from "@/components/tasks/BulkTaskChecklist";
import { ActivityFileViewer } from "@/components/activity/ActivityFileViewer";
import { ContextInput } from "@/components/activity/ContextInput";
import { DeployedAppsBar } from "@/components/activity/DeployedAppsBar";
import { MarkdownWithFileRefs } from "@/components/activity/MarkdownWithFileRefs";
import type { Questions, WorkflowMode } from "@/agent/lib/schemas";

type QuestionsResponse = Questions & {
  meta?: {
    blocking: number;
    optional: number;
    workflow_mode: WorkflowMode;
  };
};

function StatusHero({
  status,
  isRunning,
  nextAction,
  onFileSelect,
}: {
  status: string;
  isRunning: boolean;
  nextAction?: string;
  onFileSelect: (path: string) => void;
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
              <div className="mt-2 line-clamp-3 text-sm text-foreground/80">
                <MarkdownWithFileRefs content={nextAction} compact onFileSelect={onFileSelect} />
              </div>
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
            Answer the tasks on this page to continue.
          </p>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="h-full rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-xl font-semibold">Something needs attention</h2>
          <div className="mt-1 text-muted-foreground">
            <MarkdownWithFileRefs content={nextAction ?? ""} compact onFileSelect={onFileSelect} />
          </div>
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
        <LiveProgressFeed isRunning={isRunning || status === "running"} onFileSelect={onFileSelect} />
      </div>
    );
  }

  return statusCard;
}

function TasksPanel({
  data,
  onAnswered,
  onFileSelect,
}: {
  data: QuestionsResponse;
  onAnswered: () => void;
  onFileSelect: (path: string) => void;
}) {
  const blocking = data.meta?.blocking ?? 0;
  const optional = data.meta?.optional ?? 0;

  return (
    <div id="tasks" className="scroll-mt-4 space-y-4">
      <AgentStatusPanel />
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Tasks for you</CardTitle>
            {data.pending.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blocking > 0 && <Badge variant="destructive">{blocking} blocking</Badge>}
                {optional > 0 && <Badge variant="secondary">{optional} optional</Badge>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pending.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tasks right now — the agent is working or idle.
            </p>
          ) : (
            <TaskListWithBulk
              tasks={data.pending}
              onAnswered={onAnswered}
              onFileSelect={onFileSelect}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ActivityWorkspace() {
  const { state, isRunning, nextPrompt, loading, handleControl } = useAgentStatus(3000);
  const [journal, setJournal] = useState("");
  const [questions, setQuestions] = useState<QuestionsResponse>({ pending: [], resolved: [] });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const onFileSelect = useCallback((path: string) => {
    setSelectedFile(path);
    requestAnimationFrame(() => {
      document.getElementById("file-viewer")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const refreshJournal = useCallback(async () => {
    const res = await fetch("/api/journal");
    const data = await res.json();
    setJournal(data.journal ?? "");
  }, []);

  const loadQuestions = useCallback(async () => {
    const res = await fetch("/api/questions");
    setQuestions(await res.json());
  }, []);

  useEffect(() => {
    refreshJournal();
    loadQuestions();
    const interval = setInterval(() => {
      refreshJournal();
      loadQuestions();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshJournal, loadQuestions]);

  useEffect(() => {
    if (window.location.hash === "#tasks") {
      document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const journalExcerpt =
    journal.split("\n").reverse().join("\n").slice(0, 4000) || "No journal entries yet.";

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">What&apos;s Happening</h1>
          <p className="text-muted-foreground">
            Watch the agent, answer tasks, and review files — all in one place
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
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
          <DeployedAppsBar />
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-xs lg:hidden" aria-label="Jump to section">
        {[
          { href: "#status", label: "Status" },
          { href: "#logs", label: "Logs" },
          { href: "#tasks", label: "Tasks" },
          { href: "#file-viewer", label: "File" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div id="status">
        <StatusHero
          status={state?.status ?? "idle"}
          isRunning={isRunning}
          nextAction={state?.next_action}
          onFileSelect={onFileSelect}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MarkdownWithFileRefs
            content={state?.next_action ?? ""}
            onFileSelect={onFileSelect}
          />
          <div className="max-h-48 overflow-auto rounded-md bg-muted p-4">
            <MarkdownWithFileRefs
              content={nextPrompt || "Loading…"}
              compact
              onFileSelect={onFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      <div id="logs" className="grid scroll-mt-4 gap-4 lg:grid-cols-2">
        <LiveActivityPanel isRunning={isRunning} tall onFileSelect={onFileSelect} />
        <TasksPanel data={questions} onAnswered={loadQuestions} onFileSelect={onFileSelect} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What&apos;s been done</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-auto">
          <MarkdownWithFileRefs
            content={journalExcerpt}
            compact
            onFileSelect={onFileSelect}
          />
        </CardContent>
      </Card>

      <ActivityFileViewer path={selectedFile} onClose={() => setSelectedFile(null)} />

      <ContextInput />
    </div>
  );
}
