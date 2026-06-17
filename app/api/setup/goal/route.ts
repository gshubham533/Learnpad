import { NextResponse } from "next/server";
import { writeNextPrompt, writeState } from "@/agent/lib/state";

export async function POST(request: Request) {
  const { goal } = await request.json();
  if (!goal) {
    return NextResponse.json({ error: "goal required" }, { status: 400 });
  }

  await writeState({
    goal,
    phase: "discover",
    next_action: "Start the agent to begin building",
    status: "idle",
  });

  await writeNextPrompt(`# Next Task

Begin working on the user's goal: **${goal}**

1. Explore the repo and understand the starting point
2. Make a small first concrete step toward the goal
3. Update state files and journal when done
`);

  return NextResponse.json({ ok: true });
}
