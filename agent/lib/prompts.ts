import {
  readAgentRules,
  readBacklog,
  readBlueprint,
  readConfig,
  readJournal,
  readNextPrompt,
  readQuestions,
  readState,
  syncNextPromptFromBacklog,
} from "./state";
import { countTasksByPriority } from "./taskBlocking";

export async function buildSelfPrompt(): Promise<string> {
  await syncNextPromptFromBacklog();

  const [rules, state, config, journal, nextPrompt, questions, backlog, blueprint] =
    await Promise.all([
      readAgentRules(),
      readState(),
      readConfig(),
      readJournal(),
      readNextPrompt(),
      readQuestions(),
      readBacklog(),
      readBlueprint(),
    ]);

  const journalLines = journal.split("\n").slice(-30).join("\n");
  const goal = state.goal || "(not set — ask user to complete setup)";
  const taskCounts = countTasksByPriority(questions);
  const pendingBacklog = backlog.items.filter((i) => i.status === "pending");
  const blueprintExcerpt =
    blueprint && blueprint.length > 4000
      ? `${blueprint.slice(0, 4000)}\n\n… (see state/product/blueprint.md for full plan)`
      : blueprint;

  return `${rules.replace("{goal}", goal)}

---

## Current state

\`\`\`json
${JSON.stringify(state, null, 2)}
\`\`\`

## Config

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

## Workflow mode: **${config.workflow_mode}**

- **autonomous**: only \`critical\` tasks block the loop; batch questions upfront; build with stubs; configure at end.
- **collaborative**: \`normal\` and \`action_required\` tasks also block; batch by milestone, not one-by-one.

## Pending tasks by priority

- critical: ${taskCounts.critical}
- normal (optional in autonomous): ${taskCounts.normal}
- deferred (configure at end): ${taskCounts.deferred}
- action_required: ${taskCounts.actionRequired}

**Do not create single blocking tasks mid-build. Batch or defer. Only \`critical\` may block in autonomous mode.**

## Blueprint

${blueprintExcerpt ?? "(not written yet — required during discover phase)"}

## Backlog (${pendingBacklog.length} pending)

${pendingBacklog.length > 0 ? pendingBacklog.map((i) => `- [${i.phase}] ${i.id}: ${i.title} (${i.status})`).join("\n") : "(empty — populate during discover)"}

## Recent journal (last ~30 lines)

${journalLines}

## Task to execute now

${nextPrompt}

---

Execute the task above. Before finishing:
1. Update \`state/STATE.json\` (phase, status, next_action, questions_pending, etc.)
2. Append a summary to \`state/JOURNAL.md\`
3. During **build** phase: mark completed backlog items \`done\` in \`state/backlog.json\`; NEXT_PROMPT is derived from backlog
4. During **discover/polish**: write the next task to \`state/NEXT_PROMPT.md\` if no backlog item applies
5. If the dashboard needs new UI, append to \`state/ui-blocks.json\`
6. When adding tasks to \`state/questions.json\`, include \`priority\` (\`critical\` | \`normal\` | \`deferred\`) and \`kind\`. Batch questions — never one at a time mid-phase.
7. Set \`status: waiting_for_user\` **only** when \`critical\` (or \`action_required\` in collaborative) tasks block progress. Optional/deferred tasks do not pause the loop.
8. Never leave \`status: "running"\` when your turn ends
9. Never resolve, supersede, or auto-answer tasks — only the user closes tasks via Tasks or chat

Do not stop idle. Always leave a concrete next task.`;
}
