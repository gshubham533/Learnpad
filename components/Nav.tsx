"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBadge, NavDot } from "@/components/NavBadge";

const links = [
  { href: "/", label: "Home", badge: "dashboard" as const },
  { href: "/activity", label: "What's Happening", badge: "activity" as const },
  { href: "/tasks", label: "Your tasks", badge: "tasks" as const },
  { href: "/resources", label: "Resources", badge: null },
  { href: "/how-it-works", label: "How it works", badge: null },
  { href: "/settings", label: "Settings", badge: null },
  { href: "/setup", label: "Setup", badge: "setup" as const },
];

export function Nav() {
  const pathname = usePathname();
  const n = useNotifications();

  function renderBadge(kind: (typeof links)[number]["badge"]) {
    if (kind === "tasks" && n.tasks > 0) return <NavBadge count={n.tasks} />;
    if (kind === "setup" && (n.needsSetup || n.needsGoal || n.needsName)) return <NavBadge count={1} />;
    if (kind === "activity" && (n.agentError || n.agentStuck)) return <NavBadge alert />;
    if (kind === "dashboard" && n.total > 0) return <NavDot />;
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-4 py-2">
      <Link href="/" className="mr-2 font-semibold text-primary">
        Runboard
      </Link>
      {pathname !== "/" && (
        <Link
          href="/"
          className="mr-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          ← Back to chat
        </Link>
      )}
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
            pathname === link.href && "bg-accent font-medium"
          )}
        >
          {link.label}
          {renderBadge(link.badge)}
        </Link>
      ))}
      <div className="ml-auto">
        <ThemeToggle compact />
      </div>
    </nav>
  );
}
