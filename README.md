# Runboard

**Describe a goal. Supervise an agent that keeps going.**

Open cockpit for long-running, goal-driven agent projects. Paste your Cursor API key, set a goal, and supervise an agent that works in a loop — with a journal, task queue, and dashboard that grows with your project.

## Who it's for

- **Solo founders** shipping an MVP, landing page, or launch kit while the agent runs in the background
- **Operators** running multi-day initiatives (product discovery, outreach, client deliverables) with clear checkpoints
- **Developers** forking Runboard as a template for their own supervised agent product

## What makes it different

| | Cursor chat | Runboard |
|---|-------------|----------|
| **Persistence** | Session-based | File-based state you can read, version, and own |
| **Human gates** | Ad-hoc | Structured task queue — agent pauses until you answer |
| **Progress** | Scroll back through messages | Live journal + activity stream |
| **Dashboard** | Fixed UI | Grows with your project (`ui-blocks`, generated pages) |
| **Horizon** | Minutes | Hours to weeks |

Powered by [Cursor agents](https://cursor.com) — API key required.

## Quick start (non-technical)

1. **Install Node.js** (v18+) from [nodejs.org](https://nodejs.org)
2. **Clone this repo** and open a terminal in the folder
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open **http://localhost:3000/setup** in your browser
5. Paste your **Cursor API key** from the [Cursor API keys page](https://cursor.com/dashboard/api?section=user-keys#user-api-keys)
6. Describe **what you want to achieve**
7. Go to **Home** and click **Start**

That's it. One terminal command (`npm run dev`). The Start/Stop buttons control the agent.

## What you'll see

| Page | What it does |
|------|----------------|
| **Home** | Chat, Start/Stop, progress dashboard |
| **What's Happening** | Live agent activity, current task, full stream |
| **Your tasks** | Decisions the agent needs from you to keep going |
| **Resources** | Docs, launch assets, and uploads the agent creates |
| **Settings** | Self-prompting on/off, model, timeouts |
| **Setup** | API key and goal |

## Start / Stop

- **Start** — launches the agent loop in the background (no second terminal needed)
- **Stop** — halts the agent gracefully

Power users can also run:
```bash
npm run agent        # loop in foreground
npm run agent:once   # single step
npm run agent:stop   # stop via CLI
```

## Requirements

- **Cursor** desktop app installed (for local SDK agents)
- **Cursor API key** with usage credits
- macOS, Linux, or Windows

## How it works

Everything lives in `state/` as JSON and Markdown files — no database. The agent reads `AGENT.md` and state files each turn, appends to a journal, and queues tasks when it needs you.

When the work needs new UI, the agent appends to `state/ui-blocks.json` or creates pages under `app/generated/**` — the dashboard grows without breaking the core app.

The UI is a thin window onto that state: inspectable, git-friendly, and yours.

## Project structure

```
AGENT.md           # Agent rules (single source of truth)
state/             # The "database"
agent/             # Orchestrator loop
app/               # Next.js UI + API routes
components/        # UI components
```

## License

MIT
