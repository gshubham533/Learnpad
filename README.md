# Learnpad

A launchpad for learning by building. Paste your Cursor API key, describe what you want to build, and watch an autonomous agent work — with a simple dashboard to track progress, answer questions, and chat.

## Quick start (non-technical)

1. **Install Node.js** (v18+) from [nodejs.org](https://nodejs.org)
2. **Clone this repo** and open a terminal in the folder
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open **http://localhost:3000/setup** in your browser
5. Paste your **Cursor API key** (Dashboard → Integrations → User API keys)
6. Describe **what you want to build or learn**
7. Go to the **Dashboard** and click **Start**

That's it. One terminal command (`npm run dev`). The Start/Stop buttons control the agent.

## What you'll see

| Page | What it does |
|------|----------------|
| **Dashboard** | Status, Start/Stop, what's done, what's next, live activity, project files |
| **Chat** | Freeform conversation with Cursor (New Chat, live streaming) |
| **Questions** | Answer structured questions when the agent is blocked |
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

Everything is stored in `state/` as JSON and Markdown files — no database. The agent reads `AGENT.md` and state files each turn. The UI is a thin window onto that state.

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
