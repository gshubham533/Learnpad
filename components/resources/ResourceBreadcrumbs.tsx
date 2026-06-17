"use client";

import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  path: string;
}

export function ResourceBreadcrumbs({
  crumbs,
  onNavigate,
}: {
  crumbs: Breadcrumb[];
  onNavigate: (path: string) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="inline-flex items-center gap-1">
          {i > 0 && <span>/</span>}
          <button
            type="button"
            onClick={() => onNavigate(crumb.path)}
            className={cn(
              "rounded px-1 hover:text-foreground hover:underline",
              i === crumbs.length - 1 && "font-medium text-foreground"
            )}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
