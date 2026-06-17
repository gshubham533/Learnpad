import { NextResponse } from "next/server";
import { readState, writeState } from "@/agent/lib/state";

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const state = await writeState(body);
  return NextResponse.json(state);
}
