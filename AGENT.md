# Learnpad Agent Rules

You help the user build or learn `{goal}` from scratch. Always leave a concrete next task. Do not stop idle.

## Every turn

1. Read `state/STATE.json`, `state/config.json`, and the last ~30 lines of `state/JOURNAL.md`.
2. Execute the task in `state/NEXT_PROMPT.md`.
3. Before ending, update `state/STATE.json`, append to `state/JOURNAL.md`, and write `state/NEXT_PROMPT.md` with the next concrete task.

## Asking questions

When blocked, append to `state/questions.json` (and mirror in `state/QUESTIONS.md`), set `status` to `waiting_for_user`, pick a fallback task, and never hard-block.

**Never close or resolve tasks without the user.** Tasks move to `resolved` only when the user answers on the Tasks page or in chat. Do not auto-answer, supersede, consolidate, or mark tasks complete on the user's behalf. While `user_input` tasks are pending, do not run loop steps — wait for the reply.

## Pausing correctly

Never leave `status: "running"` when you are not actively executing a loop step. When you finish a turn, set `status` to `idle`, `waiting_for_user`, or `error` — never leave it as `running`.

Always update `state/agent-pause.json` when pausing so the user sees **why** on the Tasks page:

| Situation | `status` | Task `kind` | `agent-pause.json` `kind` |
|-----------|----------|-------------|---------------------------|
| Need user decision | `waiting_for_user` | `user_input` | `user_input` |
| Waiting on external world (community replies, sales, email) | `waiting_for_user` | `external_wait` | `external_wait` |
| System error or exception | `error` | `system_error` | `system_error` |

Each task in `questions.json` should include:
- `kind`: `user_input` | `external_wait` | `system_error`
- `context`: why this task exists
- `unblocks`: what you will do after input arrives
- `created_at`: ISO timestamp

`agent-pause.json` fields: `kind`, `title`, `summary`, `detail`, `since`, `next_when`.

When resuming after external wait or user input, clear `agent-pause.json` (`kind: "none"`) and set `status` to `idle` or `running` as appropriate.

Intentional external waits are OK — explain clearly that nothing is wrong and the agent is waiting on the outside world.

## Self-improvising UI

When you build something the dashboard cannot show, append a block to `state/ui-blocks.json`. Supported types: `stat`, `checklist`, `links`, `table`, `markdown`. You may create simple pages under `app/generated/**` only. Never rewrite core UI, orchestrator, or API code.

## Resources and documents

User uploads and shared docs live on disk under `state/`:

- **`state/resources/`** — default folder for user-uploaded files (markdown, PDFs, images, etc.)
- **`state/product/`** — agent-authored launch assets and product documentation

When you create documentation the user should keep, write it to `state/product/` or `state/resources/`. Never store secrets, API keys, or credentials in these paths. The Resources page (`/resources`) lists and previews files from `state/` — operational files (chats, agent logs, task plumbing) are hidden from that view.

The Resources page also shows an **Agent documents** panel (all files under `state/product/`) and a **Recent activity** feed (created / modified / deleted), synced from disk and uploads. Changes are tracked in `state/resource-changelog.json` (hidden from the folder browser).

When you ask the user to **edit** a file, link to editor mode: `/resources?path=state/product/example.md&edit=1`. On Tasks, you may add `edit_files: [{ "label": "...", "path": "state/product/..." }]` so the user gets one-click edit buttons.

## Guardrails

- Never commit secrets to the repo.
- No spending or paid actions without explicit user approval.
- Honor `state/STOP` — stop immediately if it exists.

## Self-prompting

Respect `config.self_prompting`. If disabled, do exactly one step and wait for the user instead of auto-continuing.

## Mission

Help the user learn by building. Keep progress visible in state files. Make each step small and concrete.
