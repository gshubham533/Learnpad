import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildAgentOptions, buildSendOptions } from "./lib/sdkAgent";
import { buildSelfPrompt } from "./lib/prompts";
import { consumeSdkStream } from "./lib/streamLog";
import {
  getUserInputWaitSleepMs,
  hasPendingUserInput,
  shouldAutoDecide,
  applyAutoDecide,
  syncUserInputWaitState,
} from "./lib/waitGate";
import {
  appendJournal,
  clearPid,
  readConfig,
  readQuestions,
  readSecrets,
  readState,
  refreshRunningTaskState,
  stopExists,
  summarizeNextPrompt,
  writeState,
} from "./lib/state";

const COOLDOWN_MS = 3000;
const once = process.argv.includes("--once");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runOnce(): Promise<boolean> {
  if (await stopExists()) {
    console.log("[agent] STOP flag detected, exiting.");
    await writeState({ status: "idle" });
    return false;
  }

  const secrets = await readSecrets();
  if (!secrets?.CURSOR_API_KEY) {
    console.error("[agent] No CURSOR_API_KEY in secrets.local.json or env");
    await writeState({ status: "error", next_action: "Add API key in /setup" });
    return false;
  }

  const [state, config, questions] = await Promise.all([
    readState(),
    readConfig(),
    readQuestions(),
  ]);

  if (hasPendingUserInput(questions)) {
    await syncUserInputWaitState();
    const sleepMs = await getUserInputWaitSleepMs();
    console.log(
      `[agent] ${questions.pending.length} task(s) awaiting your reply — not running loop (recheck in ${sleepMs / 60000}m)`
    );
    await sleep(sleepMs);
    return true;
  }

  if (state.status === "waiting_for_user") {
    if (await shouldAutoDecide()) {
      console.log("[agent] Auto-deciding after question timeout");
      await applyAutoDecide();
    } else {
      const sleepMs = await getUserInputWaitSleepMs();
      console.log(`[agent] Waiting for user, recheck in ${sleepMs / 60000}m`);
      await sleep(sleepMs);
      return true;
    }
  }

  const prompt = await buildSelfPrompt();
  console.log("[agent] Sending prompt, loop", state.loop_count + 1);

  await refreshRunningTaskState();
  let loopFinished = false;

  try {
    const agentOpts = buildAgentOptions(secrets.CURSOR_API_KEY, config.model);
    const sendOpts = buildSendOptions(config.model);

    const agent = state.agent_id
      ? await Agent.resume(state.agent_id, agentOpts)
      : await Agent.create(agentOpts);

    try {
      const run = await agent.send(prompt, sendOpts);
      console.log("[agent] Run started:", run.id);

      if (run.stream) {
        await consumeSdkStream(run.stream(), { source: "loop" });
      }

      const result = await run.wait();

      const agentId =
        "agentId" in agent && typeof agent.agentId === "string"
          ? agent.agentId
          : state.agent_id;

      const taskSummary = await summarizeNextPrompt();
      const afterQuestions = await readQuestions();
      const awaitingUser = hasPendingUserInput(afterQuestions);
      const nextStatus =
        result.status === "error"
          ? "error"
          : awaitingUser
            ? "waiting_for_user"
            : "idle";
      await writeState({
        agent_id: agentId ?? state.agent_id,
        loop_count: state.loop_count + 1,
        status: nextStatus,
        questions_pending: awaitingUser || afterQuestions.pending.length > 0,
        next_action:
          result.status === "error"
            ? `Retrying: ${taskSummary}`
            : taskSummary,
      });
      loopFinished = true;

      await appendJournal(
        `Loop ${state.loop_count + 1} completed with status: ${result.status}`
      );

      if (typeof agent[Symbol.asyncDispose] === "function") {
        await agent[Symbol.asyncDispose]();
      }
    } catch (inner) {
      if (typeof agent[Symbol.asyncDispose] === "function") {
        await agent[Symbol.asyncDispose]();
      }
      throw inner;
    }
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error("[agent] Startup failed:", err.message);
      await writeState({ status: "error", next_action: `Fix: ${err.message}` });
    } else {
      console.error("[agent] Error:", err);
      await writeState({ status: "error", next_action: "Check logs and retry" });
    }
    loopFinished = true;
  } finally {
    if (!loopFinished) {
      const current = await readState();
      if (current.status === "running") {
        await writeState({
          status: "error",
          next_action: "Agent loop interrupted unexpectedly — restart from Tasks",
        });
      }
    }
  }

  return true;
}

async function main() {
  console.log("[agent] Runboard orchestrator starting", once ? "(once)" : "(loop)");

  try {
    if (once) {
      await runOnce();
    } else {
      const config = await readConfig();
      while (true) {
        if (await stopExists()) break;
        const continueLoop = await runOnce();
        if (!continueLoop) break;

        const latestConfig = await readConfig();
        if (!latestConfig.self_prompting) {
          console.log("[agent] self_prompting disabled, stopping after one step");
          break;
        }

        await sleep(COOLDOWN_MS);
      }
    }
  } finally {
    await clearPid();
    const stillStopped = await stopExists();
    if (!stillStopped) {
      await writeState({ status: "idle" });
    }
    console.log("[agent] Orchestrator exited");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
