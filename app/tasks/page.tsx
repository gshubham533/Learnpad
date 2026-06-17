"use client";

import { useCallback, useEffect, useState } from "react";
import type { Questions, WorkflowMode } from "@/agent/lib/schemas";
import { AgentStatusPanel } from "@/components/tasks/AgentStatusPanel";
import { TaskListWithBulk } from "@/components/tasks/BulkTaskChecklist";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type QuestionsResponse = Questions & {
  meta?: {
    blocking: number;
    optional: number;
    workflow_mode: WorkflowMode;
  };
};

export default function TasksPage() {
  const [data, setData] = useState<QuestionsResponse>({ pending: [], resolved: [] });
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/questions");
    setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const blocking = data.meta?.blocking ?? 0;
  const optional = data.meta?.optional ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your tasks</h1>
        <p className="text-muted-foreground">
          See why the agent paused and what it needs to continue.
        </p>
        {data.pending.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {blocking > 0 && (
              <Badge variant="destructive">{blocking} blocking</Badge>
            )}
            {optional > 0 && (
              <Badge variant="secondary">{optional} optional</Badge>
            )}
          </div>
        )}
      </div>

      <AgentStatusPanel />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tasks for you</h2>

        {data.pending.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks right now — you&apos;re all caught up.
            </CardContent>
          </Card>
        ) : (
          <TaskListWithBulk tasks={data.pending} onAnswered={load} />
        )}
      </section>

      {data.resolved.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowDone(!showDone)}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {showDone ? "Hide" : "Show"} completed ({data.resolved.length})
          </button>
          {showDone &&
            data.resolved.slice(-10).reverse().map((q) => (
              <Card key={q.id}>
                <CardContent className="space-y-2 py-4 text-sm">
                  <MarkdownContent content={q.question} compact />
                  <div className="text-muted-foreground">
                    <span className="font-medium">Answer: </span>
                    <MarkdownContent content={q.answer ?? ""} compact className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </section>
      )}
    </div>
  );
}
