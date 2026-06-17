"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Questions } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function QuestionsPage() {
  const [data, setData] = useState<Questions>({ pending: [], resolved: [] });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/questions");
    setData(await res.json());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function submit(id: string, answer: string) {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer }),
    });
    if (res.ok) {
      toast.success("Answer submitted");
      await load();
    } else {
      toast.error("Failed to submit");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questions</h1>
      <p className="text-muted-foreground">
        The agent may ask structured questions when blocked. Pick an option or type your own reply.
      </p>

      {data.pending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending questions
          </CardContent>
        </Card>
      ) : (
        data.pending.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">{q.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    onClick={() => submit(q.id, opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Or type your own answer…"
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
                <Button
                  onClick={() => submit(q.id, answers[q.id] ?? "")}
                  disabled={!answers[q.id]?.trim()}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {data.resolved.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-muted-foreground">Resolved</h2>
          {data.resolved.map((q) => (
            <Card key={q.id}>
              <CardContent className="py-4 text-sm">
                <p className="font-medium">{q.question}</p>
                <p className="text-muted-foreground">→ {q.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
