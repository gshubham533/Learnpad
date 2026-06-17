import {
  readConfig,
  readQuestions,
  readState,
  syncStateAfterQuestionsChange,
  writeState,
} from "./state";
import {
  countBlockingTasks,
  hasBlockingUserInput,
} from "./taskBlocking";

/** @deprecated Use hasBlockingUserInput with workflow_mode instead. */
export function hasPendingUserInput(
  questions: Awaited<ReturnType<typeof readQuestions>>
): boolean {
  return questions.pending.some((q) => q.kind === "user_input");
}

export async function getWorkflowMode() {
  const config = await readConfig();
  return config.workflow_mode;
}

export async function hasBlockingInput(): Promise<boolean> {
  const [questions, config] = await Promise.all([readQuestions(), readConfig()]);
  return hasBlockingUserInput(questions, config.workflow_mode);
}

export async function getWaitIntervalMs(): Promise<number | null> {
  const [state, config] = await Promise.all([readState(), readConfig()]);
  if (state.status !== "waiting_for_user") return null;

  const questions = await readQuestions();
  if (!hasBlockingUserInput(questions, config.workflow_mode)) return null;

  const intervals = config.wait_gate.recheck_intervals_hours;
  const loopIndex = Math.min(state.loop_count, intervals.length - 1);
  const hours = intervals[loopIndex] ?? intervals[intervals.length - 1];
  return hours * 60 * 60 * 1000;
}

/** Tasks must only be resolved when the user replies — never auto-close. */
export async function shouldAutoDecide(): Promise<boolean> {
  const config = await readConfig();
  if (!config.auto_decide_on_timeout) return false;

  const state = await readState();
  if (state.status !== "waiting_for_user") return false;

  const questions = await readQuestions();
  const blocking = questions.pending.filter((q) =>
    hasBlockingUserInput({ pending: [q], resolved: [] }, config.workflow_mode)
  );
  const oldest = blocking[0] ?? questions.pending[0];
  if (!oldest) return false;

  const timeoutMs = config.question_timeout_hours * 60 * 60 * 1000;
  const updatedAt = state.updated_at ? new Date(state.updated_at).getTime() : 0;
  return Date.now() - updatedAt >= timeoutMs;
}

export async function applyAutoDecide() {
  const [questions, config] = await Promise.all([readQuestions(), readConfig()]);
  const blockingIdx = questions.pending.findIndex((q) =>
    hasBlockingUserInput({ pending: [q], resolved: [] }, config.workflow_mode)
  );
  const idx = blockingIdx >= 0 ? blockingIdx : 0;
  const pending = questions.pending[idx];
  if (!pending) return;

  const fallback = pending.options[pending.options.length - 1] ?? "your call";
  pending.answer = `[auto-decided after timeout] ${fallback}`;

  const remaining = questions.pending.filter((_, i) => i !== idx);

  await import("./state").then(({ writeQuestions, syncStateAfterQuestionsChange }) =>
    writeQuestions({
      pending: remaining,
      resolved: [...questions.resolved, pending],
    }).then(() => syncStateAfterQuestionsChange())
  );
}

/** Block the loop only when critical/action_required tasks are pending. */
export async function syncBlockingWaitState(): Promise<void> {
  const [questions, config] = await Promise.all([readQuestions(), readConfig()]);
  if (!hasBlockingUserInput(questions, config.workflow_mode)) return;

  await writeState({
    status: "waiting_for_user",
    questions_pending: true,
  });
}

export async function getUserInputWaitSleepMs(): Promise<number> {
  const waitMs = (await getWaitIntervalMs()) ?? 2 * 60 * 60 * 1000;
  return Math.min(waitMs, 60000);
}
