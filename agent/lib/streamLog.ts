import type { StreamEvent } from "./schemas";
import {
  appendStreamEvent,
  chatTranscriptPath,
  PATHS,
  rotateLiveLog,
} from "./state";

type StreamSource = StreamEvent["source"];

interface LogContext {
  source: StreamSource;
  chatId?: string;
}

export async function logStreamEvent(ctx: LogContext, event: Omit<StreamEvent, "ts" | "source" | "chatId">) {
  const full: StreamEvent = {
    ts: new Date().toISOString(),
    source: ctx.source,
    chatId: ctx.chatId,
    ...event,
  };

  await appendStreamEvent(PATHS.live, full);
  await rotateLiveLog();

  if (ctx.chatId) {
    await appendStreamEvent(chatTranscriptPath(ctx.chatId), full);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function consumeSdkStream(
  stream: AsyncIterable<any>,
  ctx: LogContext,
  onText?: (text: string) => void
) {
  let assistantBuffer = "";

  for await (const event of stream) {
    if (event.type === "assistant") {
      for (const block of event.message?.content ?? []) {
        if (block.type === "text" && block.text) {
          assistantBuffer += block.text;
          onText?.(block.text);
          await logStreamEvent(ctx, { type: "assistant", text: block.text });
        }
      }
    } else if (event.type === "thinking") {
      const text =
        typeof event.text === "string"
          ? event.text
          : JSON.stringify(event).slice(0, 500);
      await logStreamEvent(ctx, { type: "thinking", text });
    } else if (event.type === "tool_call") {
      const tool =
        event.tool?.name ??
        event.name ??
        event.toolName ??
        "tool";
      await logStreamEvent(ctx, { type: "tool_call", tool: String(tool) });
    } else if (event.type === "status") {
      await logStreamEvent(ctx, {
        type: "status",
        text: typeof event.status === "string" ? event.status : "working",
      });
    }
  }

  return assistantBuffer;
}
