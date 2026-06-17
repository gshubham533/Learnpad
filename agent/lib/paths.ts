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
  stop: path.join(REPO_ROOT, "state", "STOP"),
  agentPid: path.join(REPO_ROOT, "state", "agent.pid"),
  live: path.join(REPO_ROOT, "state", "live.jsonl"),
  secrets: path.join(REPO_ROOT, "secrets.local.json"),
  agentMd: path.join(REPO_ROOT, "AGENT.md"),
} as const;
