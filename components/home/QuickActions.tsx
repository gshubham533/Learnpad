"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  ListTodo,
  Activity,
  FolderOpen,
  Settings,
  Wrench,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function QuickActions({ className }: { className?: string }) {
  const router = useRouter();
  const { isRunning, loading, handleControl } = useAgentStatus(5000);
  const n = useNotifications(5000);

  const setupIncomplete = n.needsSetup || n.needsGoal || n.needsName;

  const startButton = (
    <Button
      size="sm"
      disabled={loading || setupIncomplete}
      onClick={() => handleControl("start")}
    >
      <Play className="size-3.5" />
      Start agent
    </Button>
  );

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {isRunning ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={() => handleControl("stop")}
        >
          <Square className="size-3.5" />
          Stop agent
        </Button>
      ) : setupIncomplete ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button size="sm" disabled>
              <Play className="size-3.5" />
              Start agent
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Finish setup first — add your name, API key, and goal.
          </TooltipContent>
        </Tooltip>
      ) : (
        startButton
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/activity#tasks")}
        className={cn(n.tasks > 0 && "border-primary ring-1 ring-primary/30")}
      >
        <ListTodo className="size-3.5" />
        Your tasks
        {n.tasks > 0 && (
          <Badge variant="default" className="ml-1 h-4 min-w-4 px-1">
            {n.tasks}
          </Badge>
        )}
      </Button>

      <Button variant="outline" size="sm" onClick={() => router.push("/activity")}>
        <Activity className="size-3.5" />
        Activity
        {n.agentError && <span className="ml-1 size-2 rounded-full bg-destructive" />}
      </Button>

      <Button variant="outline" size="sm" onClick={() => router.push("/resources")}>
        <FolderOpen className="size-3.5" />
        Resources
      </Button>

      <Button variant="outline" size="sm" onClick={() => router.push("/how-it-works")}>
        <BookOpen className="size-3.5" />
        How it works
      </Button>

      <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
        <Settings className="size-3.5" />
        Settings
      </Button>

      {setupIncomplete && (
        <Button variant="outline" size="sm" onClick={() => router.push("/setup")}>
          <Wrench className="size-3.5" />
          Setup
        </Button>
      )}
    </div>
  );
}

export function ScrollHint({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Link
      href="#dashboard"
      className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>View progress</span>
      <ChevronDown className="size-4 animate-bounce" />
    </Link>
  );
}
