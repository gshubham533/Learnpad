import path from "path";

export const REPO_ROOT = path.resolve(process.cwd());

export const PATHS = {
  state: path.join(REPO_ROOT, "state"),
  stateJson: path.join(REPO_ROOT, "state", "STATE.json"),
  config: path.join(REPO_ROOT, "state", "config.json"),
  journal: path.join(REPO_ROOT, "state", "JOURNAL.md"),
  nextPrompt: path.join(REPO_ROOT, "state", "NEXT_PROMPT.md"),
  questions: path.join(REPO_ROOT, "state", "questions.json"),
  questionsMd: path.join(REPO_ROOT, "state", "QUESTIONS.md"),
  uiBlocks: path.join(REPO_ROOT, "state", "ui-blocks.json"),
  chats: path.join(REPO_ROOT, "state", "chats.json"),
  chatsDir: path.join(REPO_ROOT, "state", "chats"),
  profitPlan: path.join(REPO_ROOT, "state", "profit-plan.json"),
  backlog: path.join(REPO_ROOT, "state", "backlog.json"),
  blueprint: path.join(REPO_ROOT, "state", "product", "blueprint.md"),
  product: path.join(REPO_ROOT, "state", "product"),
  resources: path.join(REPO_ROOT, "state", "resources"),
  resourceChangelog: path.join(REPO_ROOT, "state", "resource-changelog.json"),
  generated: path.join(REPO_ROOT, "app", "generated"),
  stop: path.join(REPO_ROOT, "state", "STOP"),
  agentPid: path.join(REPO_ROOT, "state", "agent.pid"),
  live: path.join(REPO_ROOT, "state", "live.jsonl"),
  agentPause: path.join(REPO_ROOT, "state", "agent-pause.json"),
  userInbox: path.join(REPO_ROOT, "state", "user-inbox.json"),
  apps: path.join(REPO_ROOT, "state", "apps.json"),
  autoRestart: path.join(REPO_ROOT, "state", "auto-restart.json"),
  secrets: path.join(REPO_ROOT, "secrets.local.json"),
  agentMd: path.join(REPO_ROOT, "AGENT.md"),
} as const;
