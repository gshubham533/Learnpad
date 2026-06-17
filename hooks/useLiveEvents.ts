"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamEvent } from "@/agent/lib/schemas";

export function useLiveEvents({
  isRunning,
  pollMs = 1500,
  maxEvents = 200,
}: {
  isRunning: boolean;
  pollMs?: number;
  maxEvents?: number;
}) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const lastTs = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function poll() {
      const params = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : "";
      const res = await fetch(`/api/live${params}`);
      const data = await res.json();
      if (!active) return;
      if (data.events?.length) {
        setEvents((prev) => {
          const merged = [...prev, ...data.events];
          return merged.slice(-maxEvents);
        });
        lastTs.current = data.events[data.events.length - 1].ts;
      }
    }

    poll();
    const interval = setInterval(poll, isRunning ? pollMs : pollMs * 2);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isRunning, pollMs, maxEvents]);

  return events;
}
