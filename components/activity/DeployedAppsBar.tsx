"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { AppRegistryItem } from "@/agent/lib/schemas";
import { Badge } from "@/components/ui/badge";

export function DeployedAppsBar() {
  const [apps, setApps] = useState<AppRegistryItem[]>([]);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((d) => setApps(d.apps ?? []))
      .catch(() => setApps([]));

    const interval = setInterval(() => {
      fetch("/api/apps")
        .then((r) => r.json())
        .then((d) => setApps(d.apps ?? []))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (apps.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="navigation" aria-label="Deployed apps">
      <span className="text-xs font-medium text-muted-foreground">Apps:</span>
      {apps.map((app) => (
        <a
          key={app.id}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium hover:bg-accent"
        >
          Open {app.name}
          <ExternalLink className="size-3 opacity-70" aria-hidden />
          <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px] capitalize">
            {app.status}
          </Badge>
        </a>
      ))}
    </div>
  );
}
