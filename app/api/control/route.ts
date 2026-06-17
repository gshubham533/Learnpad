import { NextResponse } from "next/server";
import {
  getAgentStatus,
  startAgent,
  stopAgent,
} from "@/agent/lib/processManager";
import { readState } from "@/agent/lib/state";

export async function GET() {
  const [processStatus, state] = await Promise.all([
    getAgentStatus(),
    readState(),
  ]);

  return NextResponse.json({
    process: processStatus,
    status: state.status,
    loop_count: state.loop_count,
    self_prompting: state.self_prompting,
    phase: state.phase,
    goal: state.goal,
  });
}

export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === "start") {
    const result = await startAgent();
    return NextResponse.json(result);
  }

  if (action === "stop") {
    await stopAgent();
    return NextResponse.json({ stopped: true });
  }

  return NextResponse.json({ error: "action must be start or stop" }, { status: 400 });
}
