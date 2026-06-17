"use client";

import Link from "next/link";
import { History, Settings, ListTodo, CircleHelp } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HomeHeader({ onOpenSessions }: { onOpenSessions: () => void }) {
  const n = useNotifications(5000);

  return (
    <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onOpenSessions} aria-label="Chat history">
          <History className="size-4" />
        </Button>
        <span className="font-semibold tracking-tight">Runboard</span>
      </div>
      <div className="flex items-center gap-1">
        {n.tasks > 0 && (
          <Link
            href="/activity#tasks"
            aria-label="Your tasks"
            className="relative inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
          >
            <ListTodo className="size-4" />
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">
              {n.tasks}
            </Badge>
          </Link>
        )}
        <ThemeToggle compact />
        <Link
          href="/how-it-works"
          aria-label="How it works"
          className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
        >
          <CircleHelp className="size-4" />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </header>
  );
}
