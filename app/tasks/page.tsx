"use client";

import { useCallback, useEffect, useState } from "react";
import type { Questions } from "@/agent/lib/schemas";
import { AgentStatusPanel } from "@/components/tasks/AgentStatusPanel";
import { TaskCard } from "@/components/tasks/TaskCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Card, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  const [data, setData] = useState<Questions>({ pending: [], resolved: [] });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your tasks</h1>
        <p className="text-muted-foreground">
          See why the agent paused and what it needs to continue.
        </p>
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
          data.pending.map((task) => (
            <TaskCard key={task.id} task={task} onAnswered={load} />
          ))
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
