"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useNotifications, type Notifications } from "@/hooks/useNotifications";

function bannerMessage(n: Notifications): { text: string; href: string; label: string } | null {
  if (n.tasks > 0) {
    return {
      text:
        n.tasks === 1
          ? "You have 1 task waiting."
          : `You have ${n.tasks} tasks waiting.`,
      href: "/activity#tasks",
      label: "Go to Your tasks",
    };
  }
  if (n.needsSetup || n.needsGoal || n.needsName) {
    return {
      text: "Finish setup to get started.",
      href: "/setup",
      label: "Go to Setup",
    };
  }
  if (n.agentError) {
    return {
      text: "The agent hit an error and may need your help.",
      href: "/activity",
      label: "See what's happening",
    };
  }
  return null;
}

export function ActionBanner() {
  const notifications = useNotifications();
  const [dismissedTotal, setDismissedTotal] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("runboard-banner-dismissed");
    if (stored) setDismissedTotal(parseInt(stored, 10));
  }, []);

  if (notifications.total <= 0) return null;
  if (dismissedTotal !== null && dismissedTotal >= notifications.total) return null;

  const msg = bannerMessage(notifications);
  if (!msg) return null;

  function dismiss() {
    sessionStorage.setItem("runboard-banner-dismissed", String(notifications.total));
    setDismissedTotal(notifications.total);
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Action needed:</strong> {msg.text}{" "}
          <Link href={msg.href} className="font-medium text-primary underline">
            {msg.label} →
          </Link>
        </span>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
