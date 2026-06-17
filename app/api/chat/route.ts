import { NextResponse } from "next/server";
import fs from "fs/promises";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildChatPrompt, readLoopContext } from "@/agent/lib/chatContext";
import { tryResolveTasksFromChat } from "@/agent/lib/taskResolve";
import { buildAgentOptions, buildSendOptions } from "@/agent/lib/sdkAgent";
import { consumeSdkStream, logStreamEvent } from "@/agent/lib/streamLog";
import {
  chatTranscriptPath,
  readChats,
  readConfig,
  readSecrets,
  readState,
  readStreamEvents,
  REPO_ROOT,
  writeChats,
  writeState,
} from "@/agent/lib/state";

function makeId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromPrompt(prompt: string) {
  const t = prompt.trim().slice(0, 48);
  return t.length < prompt.trim().length ? `${t}…` : t;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const loopContext = await readLoopContext();

  if (id) {
    const events = await readStreamEvents(chatTranscriptPath(id));
    const chats = await readChats();
    const session = chats.sessions.find((s) => s.id === id);
    return NextResponse.json({ session, events, loop: loopContext });
  }

  const chats = await readChats();
  return NextResponse.json({ ...chats, loop: loopContext });
}

export async function POST(request: Request) {
  const { chatId, prompt } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const secrets = await readSecrets();
  if (!secrets?.CURSOR_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 400 });
  }

  const [config, appState] = await Promise.all([
    readConfig(),
    readState(),
  ]);

  const chats = await readChats();
  const now = new Date().toISOString();

  let session = chatId
    ? chats.sessions.find((s) => s.id === chatId)
    : undefined;

  if (!session) {
    session = {
      id: makeId(),
      title: titleFromPrompt(prompt),
      agent_id: null,
      created_at: now,
      last_message_at: now,
      status: "running",
    };
    chats.sessions.unshift(session);
  } else {
    session.status = "running";
    session.last_message_at = now;
  }

  await writeChats(chats);
  await fs.mkdir(`${REPO_ROOT}/state/chats`, { recursive: true });

  await logStreamEvent(
    { source: "chat", chatId: session.id },
    { type: "user", text: prompt }
  );

  const resolvedFromChat = await tryResolveTasksFromChat(prompt);
  if (resolvedFromChat.length > 0) {
    await logStreamEvent(
      { source: "chat", chatId: session.id },
      {
        type: "status",
        text: `Resolved task(s) from chat: ${resolvedFromChat.join(", ")}`,
      }
    );
  }

  const loopContext = await readLoopContext();
  const loopAgentId = appState.agent_id;
  const resumeAgentId = loopAgentId ?? session.agent_id;
  const fullPrompt = buildChatPrompt(prompt, loopContext);

  try {
    const agentOpts = buildAgentOptions(secrets.CURSOR_API_KEY, config.model);
    const sendOpts = buildSendOptions(config.model);

    const agent = resumeAgentId
      ? await Agent.resume(resumeAgentId, agentOpts)
      : await Agent.create(agentOpts);

    try {
      const run = await agent.send(fullPrompt, sendOpts);
      if (run.stream) {
        await consumeSdkStream(run.stream(), { source: "chat", chatId: session.id });
      }
      const result = await run.wait();

      const agentId =
        "agentId" in agent && typeof agent.agentId === "string"
          ? agent.agentId
          : resumeAgentId;

      if (agentId) {
        await writeState({ agent_id: agentId });
      }

      const updated = await readChats();
      const idx = updated.sessions.findIndex((s) => s.id === session!.id);
      if (idx >= 0) {
        updated.sessions[idx] = {
          ...updated.sessions[idx],
          agent_id: agentId,
          status: result.status === "error" ? "error" : "idle",
          last_message_at: new Date().toISOString(),
        };
        await writeChats(updated);
      }

      if (typeof agent[Symbol.asyncDispose] === "function") {
        await agent[Symbol.asyncDispose]();
      }

      return NextResponse.json({
        chatId: session.id,
        status: result.status,
        agent_id: agentId,
        loop: await readLoopContext(),
      });
    } catch (inner) {
      if (typeof agent[Symbol.asyncDispose] === "function") {
        await agent[Symbol.asyncDispose]();
      }
      throw inner;
    }
  } catch (err) {
    const updated = await readChats();
    const idx = updated.sessions.findIndex((s) => s.id === session!.id);
    if (idx >= 0) {
      updated.sessions[idx].status = "error";
      await writeChats(updated);
    }

    const message = err instanceof CursorAgentError ? err.message : "Chat failed";
    await logStreamEvent(
      { source: "chat", chatId: session.id },
      { type: "error", text: message }
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const chats = await readChats();
  chats.sessions = chats.sessions.filter((s) => s.id !== id);
  await writeChats(chats);

  try {
    await fs.unlink(chatTranscriptPath(id));
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}
