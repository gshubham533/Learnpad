"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppState } from "@/agent/lib/schemas";

export function useAgentStatus(pollMs = 3000) {
  const [state, setState] = useState<AppState | null>(null);
  const [processStatus, setProcessStatus] = useState<string>("stopped");
  const [nextPrompt, setNextPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [controlRes, stateRes, nextRes] = await Promise.all([
      fetch("/api/control"),
      fetch("/api/state"),
      fetch("/api/next-prompt"),
    ]);

    const control = await controlRes.json();
    const st = await stateRes.json();
    const np = await nextRes.json();

    setProcessStatus(control.process?.status ?? "stopped");
    setState(st);
    setNextPrompt(np.content ?? "");
  }, []);

  const isRunning =
    processStatus === "running" || state?.status === "running";

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, isRunning ? Math.min(pollMs, 1500) : pollMs);
    return () => clearInterval(interval);
  }, [refresh, isRunning, pollMs]);

  async function handleControl(action: "start" | "stop") {
    setLoading(true);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "start") {
        toast.success(data.alreadyRunning ? "Agent already running" : "Agent started");
      } else {
        toast.success("Agent stopped");
      }
      await refresh();
    } catch {
      toast.error("Control action failed");
    } finally {
      setLoading(false);
    }
  }

  return {
    state,
    processStatus,
    nextPrompt,
    isRunning,
    loading,
    refresh,
    handleControl,
  };
}
