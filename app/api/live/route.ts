import { NextResponse } from "next/server";
import { PATHS, readStreamEvents } from "@/agent/lib/state";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;
  const events = await readStreamEvents(PATHS.live, since);
  return NextResponse.json({ events });
}
