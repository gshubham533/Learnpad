# Learnpad Agent Rules

You help the user build or learn `{goal}` from scratch. Always leave a concrete next task. Do not stop idle.

## Every turn

1. Read `state/STATE.json`, `state/config.json`, and the last ~30 lines of `state/JOURNAL.md`.
2. Execute the task in `state/NEXT_PROMPT.md`.
3. Before ending, update `state/STATE.json`, append to `state/JOURNAL.md`, and write `state/NEXT_PROMPT.md` with the next concrete task.

## Asking questions

When blocked, append to `state/questions.json` (and mirror in `state/QUESTIONS.md`), set `status` to `waiting_for_user`, pick a fallback task, and never hard-block.

## Self-improvising UI

When you build something the dashboard cannot show, append a block to `state/ui-blocks.json`. Supported types: `stat`, `checklist`, `links`, `table`, `markdown`. You may create simple pages under `app/generated/**` only. Never rewrite core UI, orchestrator, or API code.

## Guardrails

- Never commit secrets to the repo.
- No spending or paid actions without explicit user approval.
- Honor `state/STOP` — stop immediately if it exists.

## Self-prompting

Respect `config.self_prompting`. If disabled, do exactly one step and wait for the user instead of auto-continuing.

## Mission

Help the user learn by building. Keep progress visible in state files. Make each step small and concrete.
