"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveKey() {
    if (!apiKey.trim()) {
      toast.error("Please paste your API key");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("API key saved");
      setStep(2);
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setLoading(false);
    }
  }

  async function saveGoal() {
    if (!goal.trim()) {
      toast.error("Please describe what you want to build or learn");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          phase: "discover",
          next_action: "Start the agent to begin building",
          status: "idle",
        }),
      });
      await fetch("/api/setup/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      toast.success("Goal saved! Go to Dashboard and click Start.");
      router.push("/");
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setup</h1>
        <p className="text-muted-foreground">Step {step} of 2</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Cursor API key</CardTitle>
            <CardDescription>
              Get your key from Cursor Dashboard → Integrations → User API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="cur_…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={saveKey} disabled={loading} className="w-full">
              Save & continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to build or learn?</CardTitle>
            <CardDescription>
              Describe your project in plain language. The agent will take it from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g. A simple todo app to learn React…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
            />
            <Button onClick={saveGoal} disabled={loading} className="w-full">
              Save goal & go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
