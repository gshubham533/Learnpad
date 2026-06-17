"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

type Step = "name" | "key" | "goal";

function stepNumber(step: Step, hasKey: boolean): number {
  if (step === "name") return 1;
  if (step === "key") return 2;
  return hasKey ? 2 : 3;
}

function totalSteps(hasKey: boolean): number {
  return hasKey ? 2 : 3;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [hasKey, setHasKey] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [userName, setUserName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [secretRes, stateRes] = await Promise.all([
          fetch("/api/secret"),
          fetch("/api/state"),
        ]);
        const secrets = await secretRes.json();
        const state = await stateRes.json();

        const keyExists = Boolean(secrets.hasKey);
        setHasKey(keyExists);

        const name = state.user_name?.trim() ?? "";
        const existingGoal = state.goal?.trim() ?? "";
        if (name) setUserName(name);
        if (existingGoal) setGoal(existingGoal);

        if (!name) {
          setStep("name");
        } else if (!keyExists) {
          setStep("key");
        } else if (!existingGoal) {
          setStep("goal");
        } else {
          router.replace("/");
          return;
        }
      } catch {
        toast.error("Failed to load setup status");
      } finally {
        setInitializing(false);
      }
    }

    load();
  }, [router]);

  async function saveName() {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: userName.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Nice to meet you, ${userName.trim()}!`);
      setStep(hasKey ? "goal" : "key");
    } catch {
      toast.error("Failed to save name");
    } finally {
      setLoading(false);
    }
  }

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
      setHasKey(true);
      toast.success("API key saved");
      setStep("goal");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setLoading(false);
    }
  }

  async function saveGoal() {
    if (!goal.trim()) {
      toast.error("Please describe what you want to achieve");
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
      toast.success("You're all set! Start chatting on the home page.");
      router.push("/");
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return <p className="text-muted-foreground">Loading setup…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setup</h1>
        <p className="text-muted-foreground">
          Step {stepNumber(step, hasKey)} of {totalSteps(hasKey)}
        </p>
      </div>

      {step === "name" && (
        <Card>
          <CardHeader>
            <CardTitle>What should we call you?</CardTitle>
            <CardDescription>
              We&apos;ll use this to greet you on the home page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
            />
            <Button onClick={saveName} disabled={loading} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "key" && (
        <Card>
          <CardHeader>
            <CardTitle>Cursor API key</CardTitle>
            <CardDescription>
              Get your key from the{" "}
              <a
                href="https://cursor.com/dashboard/api?section=user-keys#user-api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
              >
                Cursor API keys page
              </a>
              , then paste it below.
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

      {step === "goal" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to achieve?</CardTitle>
            <CardDescription>
              Describe your project in plain language. The agent will take it from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasKey && (
              <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Cursor API key is already configured — no need to enter it again.
              </p>
            )}
            <Textarea
              placeholder="e.g. Launch my SaaS MVP, ship a client discovery kit, build a todo app from scratch…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
            />
            <Button onClick={saveGoal} disabled={loading} className="w-full">
              Save goal & go to Home
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
