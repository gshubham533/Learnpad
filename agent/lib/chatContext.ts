import {
  readJournal,
  readNextPrompt,
  readQuestions,
  readState,
  readConfig,
} from "./state";
import { getAgentStatus } from "./processManager";
import { countBlockingTasks } from "./taskBlocking";
import type { LoopContext } from "./schemas";

export type { LoopContext };

export async function readLoopContext(): Promise<LoopContext> {
  const [state, questions, journal, nextPrompt, process, config] = await Promise.all([
    readState(),
    readQuestions(),
    readJournal(),
    readNextPrompt(),
    getAgentStatus(),
    readConfig(),
  ]);

  const journalLines = journal.split("\n").slice(-20).join("\n");
  const { blocking, optional } = countBlockingTasks(questions, config.workflow_mode);

  return {
    goal: state.goal,
    status: state.status,
    phase: state.phase,
    workflow_mode: config.workflow_mode,
    next_action: state.next_action,
    next_prompt: nextPrompt,
    loop_count: state.loop_count,
    questions_pending: state.questions_pending || questions.pending.length > 0,
    blocking_task_count: blocking,
    optional_task_count: optional,
    pending_tasks: questions.pending.map((q) => ({
      id: q.id,
      question: q.question,
      priority: q.priority,
      kind: q.kind,
    })),
    process_running: process.status === "running",
    journal_excerpt: journalLines,
  };
}

export function buildChatPrompt(userMessage: string, ctx: LoopContext): string {
  const tasksBlock =
    ctx.pending_tasks.length > 0
      ? ctx.pending_tasks
          .map((t) => `- ${t.id}: ${t.question}`)
          .join("\n")
      : "(none)";

  const waitingNote =
    ctx.status === "waiting_for_user" || ctx.pending_tasks.length > 0
      ? `\nIMPORTANT: The build loop is waiting for the user. Tell them to open **Your tasks** on the Activity page at /activity#tasks to answer. Include the link /activity in your reply.`
      : "";

  return `[Runboard — you are connected to the supervised build loop. Answer the user about what the agent is doing, progress, blockers, and next steps. Use the context below. Be concise and friendly.${waitingNote}]

## Loop context
- Goal: ${ctx.goal || "(not set)"}
- Status: ${ctx.status}
- Phase: ${ctx.phase}
- Process running: ${ctx.process_running ? "yes" : "no"}
- Loop count: ${ctx.loop_count}
- Next action: ${ctx.next_action}

## Currently working on
${ctx.next_prompt}

## Pending user tasks (Your tasks page: /tasks)
${tasksBlock}

## Recent progress
${ctx.journal_excerpt || "(nothing yet)"}

---

User: ${userMessage}`;
}
