import { NextResponse } from "next/server";
import { runStallWatchdog } from "@/agent/lib/stallWatchdog";

export async function GET() {
  const result = await runStallWatchdog();
  return NextResponse.json(result);
}
