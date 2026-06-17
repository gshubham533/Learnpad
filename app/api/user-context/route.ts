import { NextResponse } from "next/server";
import { appendUserContext, readUserInbox } from "@/agent/lib/userInbox";

export async function GET() {
  const inbox = await readUserInbox();
  const unread = inbox.messages.filter((m) => !m.read).length;
  return NextResponse.json({ ...inbox, unread });
}

export async function POST(request: Request) {
  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  await appendUserContext(text);
  return NextResponse.json({ ok: true });
}
