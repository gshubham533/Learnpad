"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Questions, TaskPriority } from "@/agent/lib/schemas";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarkdownContent } from "@/components/MarkdownContent";

type TaskItem = Questions["pending"][number];

function groupLabel(priority: TaskPriority | undefined) {
  switch (priority) {
    case "critical":
      return "Critical — must answer";
    case "deferred":
      return "Setup later (deferred)";
    default:
      return "Preferences (optional in autonomous mode)";
  }
}

function groupTasks(tasks: TaskItem[]) {
  const order: TaskPriority[] = ["critical", "normal", "deferred"];
  const groups: { priority: TaskPriority; tasks: TaskItem[] }[] = [];

  for (const p of order) {
    const items = tasks.filter((t) => (t.priority ?? "normal") === p);
    if (items.length > 0) groups.push({ priority: p, tasks: items });
  }

  return groups;
}

export function BulkTaskChecklist({
  tasks,
  onAnswered,
}: {
  tasks: TaskItem[];
  onAnswered: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const groups = groupTasks(tasks);

  async function submitAll() {
    const payload = tasks
      .map((t) => ({ id: t.id, answer: answers[t.id]?.trim() ?? "" }))
      .filter((a) => a.answer.length > 0);

    if (payload.length === 0) {
      toast.error("Fill in at least one answer");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/questions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Submitted ${data.resolved_ids?.length ?? payload.length} answer(s)`);
      onAnswered();
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Answer multiple tasks at once</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map(({ priority, tasks: groupTasks }) => (
          <div key={priority} className="space-y-4">
            <h3 className="text-sm font-semibold">{groupLabel(priority)}</h3>
            {groupTasks.map((task) => (
              <div key={task.id} className="space-y-2 rounded-md border border-border p-3">
                <MarkdownContent content={task.question} compact />
                {task.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.options.map((opt) => (
                      <Button
                        key={opt}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [task.id]: opt }))
                        }
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{task.id}</span>
                  <Input
                    placeholder="Your answer…"
                    value={answers[task.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [task.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
        <Button onClick={submitAll} disabled={loading}>
          Submit all answers
        </Button>
      </CardContent>
    </Card>
  );
}

export function TaskListWithBulk({
  tasks,
  onAnswered,
}: {
  tasks: TaskItem[];
  onAnswered: () => void;
}) {
  if (tasks.length >= 2) {
    return (
      <div className="space-y-4">
        <BulkTaskChecklist tasks={tasks} onAnswered={onAnswered} />
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Or answer one at a time
          </summary>
          <div className="mt-4 space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onAnswered={onAnswered} />
            ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onAnswered={onAnswered} />
      ))}
    </>
  );
}
