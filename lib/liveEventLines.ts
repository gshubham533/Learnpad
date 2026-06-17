import type { StreamEvent } from "@/agent/lib/schemas";

export type ProgressLine = {
  id: string;
  ts: string;
  kind: "tool" | "status" | "thinking" | "assistant" | "error";
  text: string;
  live?: boolean;
};

function truncate(text: string, max = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function eventsToProgressLines(
  events: StreamEvent[],
  { source = "loop", maxLines = 14 }: { source?: StreamEvent["source"] | "all"; maxLines?: number } = {}
): ProgressLine[] {
  const filtered =
    source === "all" ? events : events.filter((event) => event.source === source);

  const lines: ProgressLine[] = [];
  let assistantBuffer = "";
  let assistantStartTs = "";

  function flushAssistant(live = false) {
    const text = assistantBuffer.trim();
    if (!text) return;
    lines.push({
      id: `${assistantStartTs}-${live ? "live" : "done"}`,
      ts: assistantStartTs,
      kind: "assistant",
      text: truncate(text),
      live,
    });
    if (!live) assistantBuffer = "";
  }

  for (const event of filtered) {
    if (event.type === "assistant") {
      if (!assistantBuffer) assistantStartTs = event.ts;
      assistantBuffer += event.text ?? "";
      continue;
    }

    flushAssistant();

    if (event.type === "tool_call") {
      lines.push({
        id: event.ts,
        ts: event.ts,
        kind: "tool",
        text: `Using ${event.tool ?? "tool"}`,
      });
    } else if (event.type === "thinking") {
      const text = (event.text ?? "").trim();
      if (text) {
        lines.push({
          id: event.ts,
          ts: event.ts,
          kind: "thinking",
          text: truncate(text, 160),
        });
      }
    } else if (event.type === "status") {
      lines.push({
        id: event.ts,
        ts: event.ts,
        kind: "status",
        text: event.text?.trim() || "Working…",
      });
    } else if (event.type === "error") {
      lines.push({
        id: event.ts,
        ts: event.ts,
        kind: "error",
        text: truncate(event.text ?? "Error", 160),
      });
    }
  }

  if (assistantBuffer.trim()) {
    flushAssistant(true);
  }

  return lines.slice(-maxLines);
}
