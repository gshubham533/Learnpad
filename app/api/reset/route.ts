import { NextResponse } from "next/server";
import { stopAgent } from "@/agent/lib/processManager";
import { resetAllData } from "@/agent/lib/state";

export async function POST() {
  try {
    await stopAgent();
    await resetAllData();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
