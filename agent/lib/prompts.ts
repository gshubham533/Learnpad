import { readAgentRules, readConfig, readJournal, readNextPrompt, readState } from "./state";

export async function buildSelfPrompt(): Promise<string> {
  const [rules, state, config, journal, nextPrompt] = await Promise.all([
    readAgentRules(),
    readState(),
    readConfig(),
    readJournal(),
    readNextPrompt(),
  ]);

  const journalLines = journal.split("\n").slice(-30).join("\n");
  const goal = state.goal || "(not set — ask user to complete setup)";

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

## Recent journal (last ~30 lines)

${journalLines}

## Task to execute now

${nextPrompt}

---

Execute the task above. Before finishing:
1. Update \`state/STATE.json\` (phase, status, next_action, questions_pending, etc.)
2. Append a summary to \`state/JOURNAL.md\`
3. Write the next concrete task to \`state/NEXT_PROMPT.md\`
4. If the dashboard needs new UI, append to \`state/ui-blocks.json\`
5. If blocked, add to \`state/questions.json\` (with \`kind\`, \`context\`, \`unblocks\`, \`created_at\`), update \`state/agent-pause.json\`, and set status to \`waiting_for_user\` or \`error\` as appropriate
6. Never leave \`status: "running"\` when your turn ends
7. Never resolve, supersede, or auto-answer tasks — only the user closes tasks via Tasks or chat

Do not stop idle. Always leave a concrete next task.`;
}
