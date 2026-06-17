import { NextResponse } from "next/server";
import { readLoopContext } from "@/agent/lib/chatContext";

export async function GET() {
  const loop = await readLoopContext();
  return NextResponse.json(loop);
}
