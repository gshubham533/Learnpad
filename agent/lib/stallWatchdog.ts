import type { AgentPause, AppState, Questions, TaskKind } from "./schemas";
import { getAgentStatus, startAgent } from "./processManager";
import {
  PATHS,
  canAutoRestart,
  clearAgentPause,
  isStaleNextAction,
  markAutoRestart,
  readAgentPause,
  readConfig,
  readQuestions,
  readState,
  readStreamEvents,
  refreshRunningTaskState,
  summarizeNextPrompt,
  writeAgentPause,
  writeQuestions,
  writeState,
} from "./state";

export type AgentHealthStatus =
  | "running"
  | "idle"
  | "waiting_for_user"
  | "error"
  | "stuck";

export interface AgentHealthResult {
  health: AgentHealthStatus;
  pause: AgentPause;
  state: AppState;
  process: { status: string; pid: number | null };
  lastActivityAt: string | null;
  taskSummary: string;
  pendingTasks: Questions["pending"];
  actionsTaken: string[];
}

function hasPendingKind(questions: Questions, kind: TaskKind): boolean {
  return questions.pending.some((q) => q.kind === kind);
}

function hasPendingIdPrefix(questions: Questions, prefix: string): boolean {
  return questions.pending.some((q) => q.id.startsWith(prefix));
}

async function ensureTask(
  questions: Questions,
  task: {
    id: string;
    kind: TaskKind;
    question: string;
    context: string;
    unblocks: string;
    options: string[];
  }
): Promise<Questions> {
  if (questions.pending.some((q) => q.id === task.id)) return questions;
  if (hasPendingKind(questions, task.kind) && task.kind !== "user_input") {
    return questions;
  }

  const next: Questions = {
    pending: [
      ...questions.pending,
      {
        id: task.id,
        question: task.question,
        options: task.options,
        answer: null,
        kind: task.kind,
        context: task.context,
        unblocks: task.unblocks,
        created_at: new Date().toISOString(),
      },
    ],
    resolved: questions.resolved,
  };
  await writeQuestions(next);
  return next;
}

async function getLastActivityAt(state: AppState): Promise<string | null> {
  const events = await readStreamEvents(PATHS.live);
  if (events.length > 0) return events[events.length - 1].ts;
  return state.updated_at || null;
}

function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return ms / 60000;
}

export async function runStallWatchdog(): Promise<AgentHealthResult> {
  const actionsTaken: string[] = [];
  let [state, config, process] = await Promise.all([
    readState(),
    readConfig(),
    getAgentStatus(),
  ]);

  let questions = await readQuestions();
  let pause = await readAgentPause();
  const lastActivityAt = await getLastActivityAt(state);
  const stallEnabled = config.stall_detection?.enabled ?? true;
  const stallMinutes = config.stall_detection?.no_activity_minutes ?? 15;
  const taskSummary = await summarizeNextPrompt();

  // --- process alive but state out of sync (error or stale next_action) ---
  if (process.status === "running") {
    if (state.status === "error") {
      await refreshRunningTaskState();
      await clearAgentPause();
      actionsTaken.push("recovered_error_while_running");
    } else if (
      state.status === "running" &&
      isStaleNextAction(state.next_action)
    ) {
      await refreshRunningTaskState();
      actionsTaken.push("refreshed_stale_next_action");
    }
  }

  // --- dead process with error state: auto-restart when self-prompting ---
  if (
    stallEnabled &&
    config.self_prompting &&
    state.status === "error" &&
    process.status !== "running" &&
    (await canAutoRestart())
  ) {
    const restarted = await startAgent();
    if (restarted.started) {
      await markAutoRestart();
      actionsTaken.push("auto_restarted_after_error");
    } else if (restarted.alreadyRunning) {
      await refreshRunningTaskState();
      await clearAgentPause();
      actionsTaken.push("synced_already_running_after_error");
    }
  }

  // --- zombie running: state says running but process is dead ---
  if (
    stallEnabled &&
    state.status === "running" &&
    process.status !== "running"
  ) {
    if (config.self_prompting && (await canAutoRestart())) {
      const restarted = await startAgent();
      if (restarted.started) {
        await markAutoRestart();
        actionsTaken.push("auto_restarted_zombie");
      } else {
        await writeState({
          status: "error",
          next_action: "Agent process stopped unexpectedly — restart from Tasks",
        });
        actionsTaken.push("fixed_zombie_running_state");
      }
    } else {
      await writeState({
        status: "error",
        next_action: "Agent process stopped unexpectedly — restart from Tasks",
      });
      actionsTaken.push("fixed_zombie_running_state");

      if (!hasPendingIdPrefix(questions, "stall-")) {
        questions = await ensureTask(questions, {
          id: `stall-zombie-${Date.now()}`,
          kind: "stuck",
          question: "The agent process stopped unexpectedly. Restart it?",
          context:
            "The app thought the agent was running, but the background process is no longer active.",
          unblocks: "Restarting will resume work from the last saved task.",
          options: ["Restart agent", "Stop and investigate", "Dismiss — I'll handle it"],
        });
        actionsTaken.push("created_zombie_stuck_task");
      }

      pause = await writeAgentPause({
        kind: "stuck",
        title: "Agent process stopped",
        summary: "The background agent process is no longer running.",
        detail:
          "This usually happens after a crash or manual kill. Use Restart agent below to continue.",
        since: new Date().toISOString(),
        next_when: "You click Restart agent",
      });
    }
  }

  // refresh state after possible recovery actions
  state = await readState();
  process = await getAgentStatus();

  // --- status === error (user-facing tasks when not auto-recovered) ---
  if (state.status === "error") {
    if (!hasPendingKind(questions, "system_error")) {
      questions = await ensureTask(questions, {
        id: "system-error",
        kind: "system_error",
        question: "The agent hit a system error. How should we proceed?",
        context: state.next_action || "An unexpected error stopped the agent.",
        unblocks: "Once resolved, the agent will restart from the last known task.",
        options: ["Restart agent", "View activity logs", "I'll fix it manually"],
      });
      actionsTaken.push("created_system_error_task");
    }
    if (pause.kind !== "system_error") {
      pause = await writeAgentPause({
        kind: "system_error",
        title: "System error",
        summary: state.next_action || "The agent encountered an error.",
        detail: "Review the error, fix any issues, then restart the agent.",
        since: pause.since || new Date().toISOString(),
        next_when: "You restart the agent or resolve the underlying issue",
      });
      actionsTaken.push("synced_pause_system_error");
    }
  }

  // --- hung: process alive but no activity ---
  if (
    stallEnabled &&
    state.status === "running" &&
    process.status === "running"
  ) {
    const inactiveMinutes = minutesSince(lastActivityAt);
    if (inactiveMinutes !== null && inactiveMinutes >= stallMinutes) {
      if (!hasPendingIdPrefix(questions, "stall-")) {
        questions = await ensureTask(questions, {
          id: `stall-inactive-${Date.now()}`,
          kind: "stuck",
          question: `No agent activity for ${Math.round(inactiveMinutes)} minutes. What should we do?`,
          context:
            "The agent process is running but hasn't produced any output recently. It may be stuck.",
          unblocks: "Restarting will start a fresh loop from the saved next task.",
          options: ["Restart agent", "Keep waiting", "Stop agent"],
        });
        actionsTaken.push("created_inactive_stuck_task");
      }

      if (pause.kind !== "stuck") {
        pause = await writeAgentPause({
          kind: "stuck",
          title: "Agent may be stuck",
          summary: `No activity detected for ${Math.round(inactiveMinutes)}+ minutes.`,
          detail:
            "The process is still running but nothing new has been logged. You can restart or keep waiting.",
          since: lastActivityAt || new Date().toISOString(),
          next_when: "You restart the agent or new activity appears",
        });
        actionsTaken.push("synced_pause_stuck");
      }
    }
  }

  // --- waiting_for_user but no pending questions ---
  if (state.status === "waiting_for_user" && questions.pending.length === 0) {
    if (!hasPendingIdPrefix(questions, "recovery-")) {
      questions = await ensureTask(questions, {
        id: `recovery-${Date.now()}`,
        kind: "user_input",
        question: "The agent is waiting for you but no task was found. What should it do next?",
        context:
          "The agent marked itself as waiting for input, but no task was saved. This is likely a sync issue.",
        unblocks: "Your answer will clear the wait state and let the agent continue.",
        options: ["Continue building", "Restart agent", "Pause until I say so"],
      });
      actionsTaken.push("created_recovery_task");
    }

    if (pause.kind === "none") {
      pause = await writeAgentPause({
        kind: "user_input",
        title: "Waiting for your input",
        summary: "The agent paused but no specific task was recorded.",
        detail: "Answer the recovery task below so the agent knows how to proceed.",
        since: new Date().toISOString(),
        next_when: "You complete the task below",
      });
    }
  }

  // --- sync pause for intentional waits when agent set waiting but pause is empty ---
  if (
    state.status === "waiting_for_user" &&
    questions.pending.length > 0 &&
    pause.kind === "none"
  ) {
    const first = questions.pending[0];
    const kind =
      first.kind === "external_wait"
        ? "external_wait"
        : first.kind === "system_error"
          ? "system_error"
          : first.kind === "action_required"
            ? "user_input"
            : "user_input";

    pause = await writeAgentPause({
      kind,
      title:
        kind === "external_wait"
          ? "Waiting on external input"
          : kind === "system_error"
            ? "System issue needs attention"
            : "Waiting for your input",
      summary: first.context || first.question,
      detail: first.unblocks || "Complete the task below to unblock the agent.",
      since: first.created_at || new Date().toISOString(),
      next_when: first.unblocks || "You complete the pending task",
    });
    actionsTaken.push("synced_pause_from_task");
  }

  // --- clear pause when running normally ---
  const refreshedState = await readState();
  if (
    refreshedState.status === "running" &&
    process.status === "running" &&
    pause.kind === "stuck"
  ) {
    const inactiveMinutes = minutesSince(lastActivityAt);
    if (inactiveMinutes !== null && inactiveMinutes < stallMinutes) {
      await clearAgentPause();
      pause = await readAgentPause();
      actionsTaken.push("cleared_stale_stuck_pause");
    }
  }

  if (refreshedState.status === "idle" && pause.kind !== "none" && questions.pending.length === 0) {
    await clearAgentPause();
    pause = await readAgentPause();
    actionsTaken.push("cleared_pause_on_idle");
  }

  const finalState = await readState();
  questions = await readQuestions();
  pause = await readAgentPause();
  const finalProcess = await getAgentStatus();
  const finalTaskSummary = await summarizeNextPrompt();

  let health: AgentHealthStatus = finalState.status as AgentHealthStatus;
  if (pause.kind === "stuck") health = "stuck";
  else if (finalState.status === "waiting_for_user") health = "waiting_for_user";
  else if (finalState.status === "error") health = "error";
  else if (finalState.status === "running") health = "running";
  else health = "idle";

  return {
    health,
    pause,
    state: finalState,
    process: { status: finalProcess.status, pid: finalProcess.pid },
    lastActivityAt,
    taskSummary: finalTaskSummary,
    pendingTasks: questions.pending,
    actionsTaken,
  };
}
