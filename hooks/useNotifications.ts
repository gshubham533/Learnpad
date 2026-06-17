"use client";

import { useEffect, useState } from "react";

export interface Notifications {
  tasks: number;
  needsSetup: boolean;
  needsGoal: boolean;
  needsName: boolean;
  agentError: boolean;
  agentStuck: boolean;
  waitingForUser: boolean;
  total: number;
}

const empty: Notifications = {
  tasks: 0,
  needsSetup: false,
  needsGoal: false,
  needsName: false,
  agentError: false,
  agentStuck: false,
  waitingForUser: false,
  total: 0,
};

export function useNotifications(pollMs = 5000) {
  const [notifications, setNotifications] = useState<Notifications>(empty);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) setNotifications(await res.json());
      } catch {
        // ignore
      }
    }

    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [pollMs]);

  return notifications;
}
