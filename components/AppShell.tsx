"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ActionBanner } from "@/components/ActionBanner";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome && <Nav />}
      {!isHome && <ActionBanner />}
      <main className={cn(!isHome && "mx-auto max-w-6xl p-4 md:p-6")}>{children}</main>
    </>
  );
}
