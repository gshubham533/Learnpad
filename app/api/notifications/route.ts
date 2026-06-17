import { NextResponse } from "next/server";
import { runStallWatchdog } from "@/agent/lib/stallWatchdog";
import { readSecretsMasked } from "@/agent/lib/state";

export async function GET() {
  const health = await runStallWatchdog();
  const secrets = await readSecretsMasked();

  const tasks = health.pendingTasks.length;
  const needsSetup = !secrets.hasKey;
  const needsGoal = !health.state.goal?.trim();
  const needsName = !health.state.user_name?.trim();
  const agentError = health.health === "error" || health.state.status === "error";
  const agentStuck = health.health === "stuck";
  const waitingForUser =
    health.health === "waiting_for_user" ||
    health.state.questions_pending ||
    tasks > 0;

  let total = tasks;
  if (needsSetup) total += 1;
  if (needsGoal) total += 1;
  if (needsName) total += 1;
  if (agentError || agentStuck) total += 1;

  return NextResponse.json({
    tasks,
    needsSetup,
    needsGoal,
    needsName,
    agentError,
    agentStuck,
    waitingForUser,
    total,
  });
}
