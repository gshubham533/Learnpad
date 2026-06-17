import { NextResponse } from "next/server";
import { readAgentPause, writeAgentPause } from "@/agent/lib/state";

export async function GET() {
  const pause = await readAgentPause();
  return NextResponse.json(pause);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const pause = await writeAgentPause(body);
  return NextResponse.json(pause);
}
