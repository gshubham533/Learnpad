"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppConfig } from "@/agent/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const MODELS = ["composer-2.5", "composer-2", "gpt-5.3-codex", "claude-4-sonnet"];

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function save(partial: Partial<AppConfig>) {
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

  if (!config) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

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
            onCheckedChange={(checked) => save({ self_prompting: checked })}
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
              onClick={() => save({ model: m })}
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
              save({ question_timeout_hours: parseInt(e.target.value, 10) || 4 })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
