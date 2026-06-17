"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ChatSession } from "@/agent/lib/schemas";
import type { StreamEvent } from "@/agent/lib/schemas";
import type { AppState } from "@/agent/lib/schemas";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ChatSessionSheet } from "@/components/home/ChatSessionSheet";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ChatComposer } from "@/components/home/ChatComposer";

export function HomeChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [state, setState] = useState<AppState | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/chat");
    const data = await res.json();
    setSessions(data.sessions ?? []);
    return data.sessions as ChatSession[];
  }, []);

  const loadTranscript = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    setEvents(data.events ?? []);
    setIsRunning(data.session?.status === "running");
    return data.session as ChatSession | undefined;
  }, []);

  const loadState = useCallback(async () => {
    const res = await fetch("/api/state");
    if (res.ok) setState(await res.json());
  }, []);

  useEffect(() => {
    loadSessions();
    loadState();
    const interval = setInterval(() => {
      loadSessions();
      loadState();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadSessions, loadState]);

  useEffect(() => {
    if (!activeId) return;
    loadTranscript(activeId);
    const interval = setInterval(() => loadTranscript(activeId), isRunning ? 1000 : 5000);
    return () => clearInterval(interval);
  }, [activeId, isRunning, loadTranscript]);

  useEffect(() => {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollHint(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(dashboard);
    return () => observer.disconnect();
  }, []);

  function handleNew() {
    setActiveId(null);
    setEvents([]);
    setPrompt("");
  }

  async function handleSend() {
    if (!prompt.trim() || sending) return;
    setSending(true);
    setIsRunning(true);

    const userEvent: StreamEvent = {
      ts: new Date().toISOString(),
      source: "chat",
      type: "user",
      text: prompt.trim(),
    };
    setEvents((prev) => [...prev, userEvent]);
    const currentPrompt = prompt.trim();
    setPrompt("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeId, prompt: currentPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!activeId && data.chatId) setActiveId(data.chatId);
      await loadSessions();
      if (data.chatId) await loadTranscript(data.chatId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
      setIsRunning(false);
    }
  }

  const userName = state?.user_name?.trim();
  const greeting = userName
    ? `Hi ${userName}, what should we work on today?`
    : "Hi there, what should we work on today?";

  const emptyMessage =
    events.length === 0
      ? greeting
      : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <HomeHeader onOpenSessions={() => setSheetOpen(true)} />

      <ChatSessionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
      />

      <ChatTranscript
        events={events}
        isRunning={isRunning || sending}
        emptyMessage={emptyMessage}
        hideInternalEvents
      />

      <ChatComposer
        prompt={prompt}
        onPromptChange={setPrompt}
        onSend={handleSend}
        sending={sending}
        showScrollHint={showScrollHint}
      />
    </div>
  );
}
