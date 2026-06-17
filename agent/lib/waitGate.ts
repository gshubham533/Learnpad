import { readConfig, readQuestions, readState, writeState } from "./state";

export function hasPendingUserInput(
  questions: Awaited<ReturnType<typeof readQuestions>>
): boolean {
  return questions.pending.some((q) => q.kind === "user_input");
}

export async function getWaitIntervalMs(): Promise<number | null> {
  const [state, config] = await Promise.all([readState(), readConfig()]);
  if (state.status !== "waiting_for_user") return null;

  const questions = await readQuestions();
  if (questions.pending.length === 0) return null;

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
  const oldest = questions.pending[0];
  if (!oldest) return false;

  const timeoutMs = config.question_timeout_hours * 60 * 60 * 1000;
  const updatedAt = state.updated_at ? new Date(state.updated_at).getTime() : 0;
  return Date.now() - updatedAt >= timeoutMs;
}

export async function applyAutoDecide() {
  const questions = await readQuestions();
  const pending = questions.pending[0];
  if (!pending) return;

  const fallback = pending.options[pending.options.length - 1] ?? "your call";
  pending.answer = `[auto-decided after timeout] ${fallback}`;

  await import("./state").then(({ writeQuestions }) =>
    writeQuestions({
      pending: questions.pending.slice(1),
      resolved: [...questions.resolved, pending],
    })
  );

  await writeState({
    status: "running",
    questions_pending: questions.pending.length > 1,
  });
}

/** Block the loop until the user answers pending user_input tasks. */
export async function syncUserInputWaitState(): Promise<void> {
  const questions = await readQuestions();
  if (!hasPendingUserInput(questions)) return;

  await writeState({
    status: "waiting_for_user",
    questions_pending: true,
  });
}

export async function getUserInputWaitSleepMs(): Promise<number> {
  const waitMs = (await getWaitIntervalMs()) ?? 2 * 60 * 60 * 1000;
  return Math.min(waitMs, 60000);
}
