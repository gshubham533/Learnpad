import type { AppConfig, Questions, TaskKind, TaskPriority } from "./schemas";

export type WorkflowMode = AppConfig["workflow_mode"];

export function taskPriority(task: Questions["pending"][number]): TaskPriority {
  return task.priority ?? "normal";
}

export function isTaskBlocking(
  task: Questions["pending"][number],
  workflowMode: WorkflowMode
): boolean {
  const kind = task.kind as TaskKind;
  if (kind === "stuck" || kind === "system_error") return true;
  if (kind === "action_required") return workflowMode === "collaborative";
  if (kind === "external_wait") return false;
  if (kind === "user_input") {
    const p = taskPriority(task);
    if (p === "critical") return true;
    if (p === "deferred") return false;
    return workflowMode === "collaborative";
  }
  return false;
}

export function hasBlockingUserInput(
  questions: Questions,
  workflowMode: WorkflowMode
): boolean {
  return questions.pending.some((q) => isTaskBlocking(q, workflowMode));
}

export function countTasksByPriority(questions: Questions) {
  let critical = 0;
  let normal = 0;
  let deferred = 0;
  let blocking = 0;
  let actionRequired = 0;

  for (const q of questions.pending) {
    const p = taskPriority(q);
    if (p === "critical") critical++;
    else if (p === "deferred") deferred++;
    else normal++;
    if (q.kind === "action_required") actionRequired++;
  }

  return { critical, normal, deferred, actionRequired, total: questions.pending.length };
}

export function countBlockingTasks(
  questions: Questions,
  workflowMode: WorkflowMode
) {
  const blocking = questions.pending.filter((q) =>
    isTaskBlocking(q, workflowMode)
  ).length;
  const optional = questions.pending.length - blocking;
  return { blocking, optional, total: questions.pending.length };
}
