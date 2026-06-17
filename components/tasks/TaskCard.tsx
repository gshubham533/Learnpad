"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Questions, TaskKind } from "@/agent/lib/schemas";
import { TaskFileUpload } from "@/components/tasks/TaskFileUpload";
import { MarkdownWithFileRefs } from "@/components/activity/MarkdownWithFileRefs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type TaskItem = Questions["pending"][number];

function kindLabel(kind: TaskKind) {
  switch (kind) {
    case "action_required":
      return "Action required";
    case "external_wait":
      return "External wait";
    case "system_error":
      return "System issue";
    case "stuck":
      return "Stuck";
    default:
      return "Your input";
  }
}

function priorityLabel(priority: TaskItem["priority"]) {
  switch (priority) {
    case "critical":
      return "Critical";
    case "deferred":
      return "Deferred";
    default:
      return "Optional";
  }
}

function priorityVariant(
  priority: TaskItem["priority"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "critical":
      return "destructive";
    case "deferred":
      return "outline";
    default:
      return "secondary";
  }
}

function kindVariant(kind: TaskKind): "default" | "secondary" | "destructive" | "outline" {
  switch (kind) {
    case "stuck":
    case "system_error":
      return "destructive";
    case "external_wait":
      return "outline";
    default:
      return "secondary";
  }
}

function taskTitle(question: string) {
  const line = question.split("\n")[0]?.replace(/[#*_`]/g, "").trim() ?? "";
  return line.length > 80 ? `${line.slice(0, 77)}…` : line || "Task";
}

function isRestartAnswer(text: string) {
  return /restart/i.test(text);
}

export function TaskCard({
  task,
  onAnswered,
  onFileSelect,
}: {
  task: TaskItem;
  onAnswered: () => void;
  onFileSelect?: (path: string) => void;
}) {
  const [customAnswer, setCustomAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(answer: string) {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      if (isRestartAnswer(answer)) {
        await fetch("/api/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        });
        toast.success("Agent restart requested");
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, answer: answer.trim() }),
      });

      if (!res.ok) throw new Error();
      toast.success("Task completed");
      onAnswered();
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  const showRestartPrimary = task.kind === "stuck" || task.kind === "system_error";
  const title = taskTitle(task.question);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={kindVariant(task.kind)}>{kindLabel(task.kind)}</Badge>
          <Badge variant={priorityVariant(task.priority)}>
            {priorityLabel(task.priority)}
          </Badge>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{task.id}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {onFileSelect ? (
          <MarkdownWithFileRefs content={task.question} onFileSelect={onFileSelect} />
        ) : (
          <MarkdownWithFileRefs content={task.question} />
        )}

        {task.context && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>
            <MarkdownWithFileRefs
              content={task.context}
              compact
              className="mt-1"
              onFileSelect={onFileSelect}
            />
          </div>
        )}

        {task.unblocks && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Then: </span>
            <MarkdownWithFileRefs
              content={task.unblocks}
              compact
              className="mt-1"
              onFileSelect={onFileSelect}
            />
          </div>
        )}

        {task.edit_files && task.edit_files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Related files</p>
            <div className="flex flex-wrap gap-2">
              {task.edit_files.map((file) =>
                onFileSelect ? (
                  <Button
                    key={file.path}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onFileSelect(file.path)}
                  >
                    <Pencil className="size-3.5" />
                    {file.label}
                  </Button>
                ) : null
              )}
            </div>
          </div>
        )}

        {task.accept_files && (
          <TaskFileUpload
            taskId={task.id}
            fileHint={task.file_hint}
            onUploaded={onAnswered}
          />
        )}

        {showRestartPrimary && (
          <Button disabled={loading} onClick={() => submit("Restart agent")}>
            Restart agent
          </Button>
        )}

        <div className="flex flex-wrap gap-2">
          {task.options.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => submit(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Or type your own answer…"
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(customAnswer)}
          />
          <Button
            onClick={() => submit(customAnswer)}
            disabled={loading || !customAnswer.trim()}
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
