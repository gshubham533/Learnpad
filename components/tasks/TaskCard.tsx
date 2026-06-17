"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Questions, TaskKind } from "@/agent/lib/schemas";
import { resourceEditUrl } from "@/lib/resource-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MarkdownContent } from "@/components/MarkdownContent";

type TaskItem = Questions["pending"][number];

function kindLabel(kind: TaskKind) {
  switch (kind) {
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

function isRestartAnswer(text: string) {
  return /restart/i.test(text);
}

export function TaskCard({
  task,
  onAnswered,
}: {
  task: TaskItem;
  onAnswered: () => void;
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={kindVariant(task.kind)}>{kindLabel(task.kind)}</Badge>
          <CardTitle className="text-base">{task.id}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MarkdownContent content={task.question} />

        {task.context && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>
            <MarkdownContent content={task.context} compact className="mt-1" />
          </div>
        )}

        {task.unblocks && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Then: </span>
            <MarkdownContent content={task.unblocks} compact className="mt-1" />
          </div>
        )}

        {task.edit_files && task.edit_files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Edit files</p>
            <div className="flex flex-wrap gap-2">
              {task.edit_files.map((file) => (
                <Link
                  key={file.path}
                  href={resourceEditUrl(file.path)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
                >
                  <Pencil className="size-3.5" />
                  {file.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {showRestartPrimary && (
          <Button
            disabled={loading}
            onClick={() => submit("Restart agent")}
          >
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
