import { NextResponse } from "next/server";
import {
  writeBacklog,
  writeConfig,
  writeNextPrompt,
  writeState,
} from "@/agent/lib/state";
import { detectWorkflowMode } from "@/agent/lib/workflow";

export async function POST(request: Request) {
  const { goal } = await request.json();
  if (!goal) {
    return NextResponse.json({ error: "goal required" }, { status: 400 });
  }

  const workflowMode = detectWorkflowMode(goal);

  await writeConfig({ workflow_mode: workflowMode });
  await writeState({
    goal,
    phase: "discover",
    next_action: "Discover sprint — research goal and write blueprint",
    status: "idle",
  });

  await writeBacklog({
    items: [
      {
        id: "discover-1",
        title: "Research repo and goal; draft blueprint",
        status: "pending",
        phase: "discover",
        detail:
          "Explore the codebase and user goal. Start state/product/blueprint.md with end-to-end vision, assumptions, and deferred config list.",
      },
      {
        id: "discover-2",
        title: "Batch all user questions and populate build backlog",
        status: "pending",
        phase: "discover",
        detail:
          "List every unknown. Create ALL questions in state/questions.json in one batch (with priority). Populate state/backlog.json with build items. Advance to build if no critical blockers.",
      },
    ],
  });

  await writeNextPrompt(`# Discover Sprint (do NOT build yet)

Workflow mode: **${workflowMode}**

Goal: **${goal}**

## Loop 1 — Research & draft blueprint
1. Explore the repo and understand the starting point
2. Write or update \`state/product/blueprint.md\` with end-to-end vision, assumptions, deferred config
3. Mark \`discover-1\` done in \`state/backlog.json\`

## Loop 2 — Batch questions & plan build
1. List every unknown; create ALL questions in \`state/questions.json\` in one batch (with \`priority\`)
2. Populate \`state/backlog.json\` with all build-phase items
3. Mark \`discover-2\` done; set phase to \`build\` if no critical blockers

**Rules:** Do not ask questions one at a time. Do not start building until discover backlog is complete.
`);

  return NextResponse.json({ ok: true, workflow_mode: workflowMode });
}
