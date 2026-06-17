"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ChatSession } from "@/agent/lib/schemas";
import type { StreamEvent } from "@/agent/lib/schemas";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatTranscript } from "@/components/ChatTranscript";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

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

  useEffect(() => {
    loadSessions().then((s) => {
      if (s.length > 0 && !activeId) setActiveId(s[0].id);
    });
  }, [loadSessions, activeId]);

  useEffect(() => {
    if (!activeId) return;
    loadTranscript(activeId);
    const interval = setInterval(() => loadTranscript(activeId), isRunning ? 1000 : 5000);
    return () => clearInterval(interval);
  }, [activeId, isRunning, loadTranscript]);

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

      if (!activeId && data.chatId) {
        setActiveId(data.chatId);
      }
      await loadSessions();
      if (data.chatId) await loadTranscript(data.chatId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
      setIsRunning(false);
    }
  }

  async function handleDelete() {
    if (!activeId) return;
    await fetch(`/api/chat?id=${encodeURIComponent(activeId)}`, { method: "DELETE" });
    setActiveId(null);
    setEvents([]);
    await loadSessions();
    toast.success("Chat deleted");
  }

  const activeSession = sessions.find((s) => s.id === activeId);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        {activeSession && (
          <div className="flex items-center gap-2">
            <Badge>{activeSession.status}</Badge>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border">
        <div className="w-56 shrink-0">
          <ChatSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={handleNew}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatTranscript events={events} isRunning={isRunning || sending} />
          <div className="border-t border-border p-4">
            <div className="mx-auto flex max-w-3xl gap-2">
              <Textarea
                placeholder="Ask Cursor anything about this project…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={sending || !prompt.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
