"use client";

import type { ChatSession } from "@/agent/lib/schemas";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatSidebar } from "@/components/ChatSidebar";

export function ChatSessionSheet({
  open,
  onOpenChange,
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  function handleSelect(id: string) {
    onSelect(id);
    onOpenChange(false);
  }

  function handleNew() {
    onNew();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Chat sessions</SheetTitle>
        </SheetHeader>
        <ChatSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
        />
      </SheetContent>
    </Sheet>
  );
}
