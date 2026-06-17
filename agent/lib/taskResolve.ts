import { readConfig, readQuestions, resolveQuestion } from "./state";
import { isTaskBlocking } from "./taskBlocking";

function extractAnswerAfterId(message: string, taskId: string): string | null {
  const idx = message.indexOf(taskId);
  if (idx === -1) return null;
  const rest = message.slice(idx + taskId.length).replace(/^[\s:=\-–—]+/, "").trim();
  return rest.length >= 1 ? rest : message.replace(taskId, "").trim() || null;
}

/** Try to resolve pending tasks from a chat message. Returns resolved task ids. */
export async function tryResolveTasksFromChat(message: string): Promise<string[]> {
  const trimmed = message.trim();
  if (trimmed.length < 2) return [];

  const [questions, config] = await Promise.all([readQuestions(), readConfig()]);
  if (questions.pending.length === 0) return [];

  const resolved: string[] = [];

  for (const task of questions.pending) {
    if (!trimmed.includes(task.id)) continue;
    const answer = extractAnswerAfterId(trimmed, task.id);
    if (answer && answer.length >= 1) {
      const ok = await resolveQuestion(task.id, answer);
      if (ok) resolved.push(task.id);
    }
  }

  if (resolved.length > 0) return resolved;

  for (const task of questions.pending) {
    for (const opt of task.options) {
      if (trimmed.toLowerCase() === opt.toLowerCase()) {
        const ok = await resolveQuestion(task.id, opt);
        if (ok) resolved.push(task.id);
        break;
      }
    }
  }

  if (resolved.length > 0) return resolved;

  const blocking = questions.pending.filter((q) =>
    isTaskBlocking(q, config.workflow_mode)
  );

  if (
    blocking.length === 1 &&
    trimmed.length >= 8 &&
    !trimmed.endsWith("?") &&
    !/^(what|how|why|when|where|who|can you|could you|please explain)/i.test(trimmed)
  ) {
    const ok = await resolveQuestion(blocking[0].id, trimmed);
    if (ok) resolved.push(blocking[0].id);
  }

  return resolved;
}
