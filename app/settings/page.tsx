"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AppConfig, AppState } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { ThemeSetting } from "@/components/ThemeToggle";

const MODELS = ["composer-2.5", "composer-2", "gpt-5.3-codex", "claude-4-sonnet"];

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [userName, setUserName] = useState("");
  const [goal, setGoal] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function load() {
      const [configRes, stateRes, secretRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/state"),
        fetch("/api/secret"),
      ]);
      setConfig(await configRes.json());
      const state: AppState = await stateRes.json();
      setUserName(state.user_name ?? "");
      setGoal(state.goal ?? "");
      const secret = await secretRes.json();
      setHasKey(Boolean(secret.hasKey));
      setMaskedKey(secret.masked ?? null);
    }
    load();
  }, []);

  async function saveConfig(partial: Partial<AppConfig>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const updated = await res.json();
      setConfig(updated);
      await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ self_prompting: updated.self_prompting }),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!goal.trim()) {
      toast.error("Please enter your goal");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName.trim(),
          goal: goal.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function resetAllData() {
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("All data reset. Starting fresh.");
      router.push("/setup");
    } catch {
      toast.error("Failed to reset data");
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
      setResetConfirmText("");
    }
  }

  async function saveApiKey() {
    if (!apiKey.trim()) {
      toast.error("Please paste your API key");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) throw new Error();
      const secretRes = await fetch("/api/secret");
      const secret = await secretRes.json();
      setHasKey(Boolean(secret.hasKey));
      setMaskedKey(secret.masked ?? null);
      setApiKey("");
      toast.success("API key updated");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!config) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Update your profile, API key, and agent preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your profile</CardTitle>
          <CardDescription>
            Name and goal used across the app and by the agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="user-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="user-name"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="goal" className="text-sm font-medium">
              Goal
            </label>
            <Textarea
              id="goal"
              placeholder="What do you want to build or learn?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={saveProfile} disabled={savingProfile} className="w-full">
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cursor API key</CardTitle>
          <CardDescription>
            {hasKey && maskedKey ? (
              <>Current key: <code className="text-xs">{maskedKey}</code></>
            ) : (
              "No API key saved yet."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder={hasKey ? "Paste a new key to replace…" : "cur_…"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button
            onClick={saveApiKey}
            disabled={savingProfile || !apiKey.trim()}
            variant={hasKey ? "outline" : "default"}
            className="w-full"
          >
            {hasKey ? "Update API key" : "Save API key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose light, dark, or match your system preference.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSetting />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Self-prompting</CardTitle>
            {config.self_prompting_recommended && (
              <Badge>Recommended: On</Badge>
            )}
          </div>
          <CardDescription>
            When on, the agent keeps working automatically. When off, it does one step per Start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Switch
            checked={config.self_prompting}
            onCheckedChange={(checked) => saveConfig({ self_prompting: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MODELS.map((m) => (
            <Button
              key={m}
              variant={config.model === m ? "default" : "outline"}
              size="sm"
              className="mr-2"
              onClick={() => saveConfig({ model: m })}
              disabled={saving}
            >
              {m}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question timeout (hours)</CardTitle>
          <CardDescription>
            Auto-decide if the user doesn&apos;t answer in time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            min={1}
            value={config.question_timeout_hours}
            onChange={(e) =>
              saveConfig({ question_timeout_hours: parseInt(e.target.value, 10) || 4 })
            }
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Erase all agent progress and start over. Your API key and agent preferences are kept.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showResetConfirm ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset all data
            </Button>
          ) : (
            <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground">
                This permanently deletes your profile, goal, chats, journal, tasks, dashboard
                blocks, generated pages, and uploaded resources. Type{" "}
                <strong className="text-foreground">RESET</strong> to confirm.
              </p>
              <Input
                placeholder="Type RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText("");
                  }}
                  disabled={resetting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={resetAllData}
                  disabled={resetting || resetConfirmText !== "RESET"}
                >
                  {resetting ? "Resetting…" : "Confirm reset"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
