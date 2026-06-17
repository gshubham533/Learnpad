"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/questions", label: "Questions" },
  { href: "/settings", label: "Settings" },
  { href: "/setup", label: "Setup" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-4 py-2">
      <span className="mr-4 font-semibold text-primary">Learnpad</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
            pathname === link.href && "bg-accent font-medium"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
