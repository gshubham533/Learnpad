import fs from "fs/promises";
import path from "path";
import { PATHS, REPO_ROOT } from "./paths";
import {
  AgentPauseSchema,
  AppConfig,
  AppState,
  AgentPause,
  ChatsSchema,
  ConfigSchema,
  Questions,
  QuestionsSchema,
  StateSchema,
  UiBlocksSchema,
  SecretsSchema,
  StreamEvent,
  StreamEventSchema,
} from "./schemas";

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJsonFile<T>(
  filePath: string,
  schema: { parse: (data: unknown) => T },
  fallback: unknown
): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return schema.parse(JSON.parse(raw));
  } catch {
    return schema.parse(fallback);
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function readState(): Promise<AppState> {
  return readJsonFile(PATHS.stateJson, StateSchema, StateSchema.parse({}));
}

export async function writeState(partial: Partial<AppState>) {
  const current = await readState();
  const next = StateSchema.parse({
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
  });
  await writeJsonFile(PATHS.stateJson, next);
  return next;
}

export async function readConfig(): Promise<AppConfig> {
  return readJsonFile(PATHS.config, ConfigSchema, ConfigSchema.parse({}));
}

export async function writeConfig(partial: Partial<AppConfig>) {
  const current = await readConfig();
  const next = ConfigSchema.parse({ ...current, ...partial });
  await writeJsonFile(PATHS.config, next);
  return next;
}

export async function readQuestions(): Promise<Questions> {
  return readJsonFile(PATHS.questions, QuestionsSchema, { pending: [], resolved: [] });
}

export async function writeQuestions(data: Questions) {
  const next = QuestionsSchema.parse(data);
  await writeJsonFile(PATHS.questions, next);
  await syncQuestionsMd(next);
  return next;
}

export async function readAgentPause(): Promise<AgentPause> {
  return readJsonFile(PATHS.agentPause, AgentPauseSchema, AgentPauseSchema.parse({}));
}

export async function writeAgentPause(partial: Partial<AgentPause>) {
  const current = await readAgentPause();
  const next = AgentPauseSchema.parse({ ...current, ...partial });
  await writeJsonFile(PATHS.agentPause, next);
  return next;
}

export async function clearAgentPause() {
  return writeAgentPause({
    kind: "none",
    title: "",
    summary: "",
    detail: "",
    since: "",
    next_when: "",
  });
}

async function syncQuestionsMd(data: Questions) {
  const lines = ["# Questions for the user", ""];
  if (data.pending.length === 0) {
    lines.push("No pending questions.");
  } else {
    for (const q of data.pending) {
      lines.push(`## ${q.id}`);
      lines.push(q.question);
      lines.push("");
      q.options.forEach((opt, i) => lines.push(`${i + 1}. ${opt}`));
      lines.push("");
      lines.push(`Answer: ${q.answer ?? "(pending)"}`);
      lines.push("");
    }
  }
  await fs.writeFile(PATHS.questionsMd, lines.join("\n"), "utf-8");
}

export async function readUiBlocks() {
  return readJsonFile(PATHS.uiBlocks, UiBlocksSchema, { blocks: [] });
}

export async function readChats() {
  return readJsonFile(PATHS.chats, ChatsSchema, { sessions: [] });
}

export async function writeChats(data: ReturnType<typeof ChatsSchema.parse>) {
  const next = ChatsSchema.parse(data);
  await writeJsonFile(PATHS.chats, next);
  return next;
}

export async function readJournal(): Promise<string> {
  try {
    return await fs.readFile(PATHS.journal, "utf-8");
  } catch {
    return "# Learnpad Journal\n";
  }
}

export async function appendJournal(entry: string) {
  const ts = new Date().toISOString();
  const block = `\n## ${ts}\n\n${entry.trim()}\n`;
  await fs.appendFile(PATHS.journal, block, "utf-8");
}

export async function readNextPrompt(): Promise<string> {
  try {
    return await fs.readFile(PATHS.nextPrompt, "utf-8");
  } catch {
    return "# Next Task\n\nRun setup wizard.\n";
  }
}

const STALE_NEXT_ACTION =
  /restart from tasks|review error|stopped unexpectedly|interrupted unexpectedly|^fix:|check logs and retry/i;

export function isStaleNextAction(action: string): boolean {
  return STALE_NEXT_ACTION.test(action);
}

export async function summarizeNextPrompt(): Promise<string> {
  const raw = await readNextPrompt();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const cleaned = trimmed
      .replace(/^\d+\.\s*/, "")
      .replace(/^[-*]\s*/, "")
      .replace(/`/g, "");
    if (!cleaned) continue;
    return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned;
  }
  return "Continue with the next task";
}

export async function refreshRunningTaskState(): Promise<string> {
  const summary = await summarizeNextPrompt();
  await writeState({ status: "running", next_action: summary });
  return summary;
}

const AUTO_RESTART_COOLDOWN_MS = 60_000;

export async function canAutoRestart(): Promise<boolean> {
  try {
    const raw = await fs.readFile(PATHS.autoRestart, "utf-8");
    const { at } = JSON.parse(raw) as { at: string };
    return Date.now() - new Date(at).getTime() >= AUTO_RESTART_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export async function markAutoRestart() {
  await writeJsonFile(PATHS.autoRestart, { at: new Date().toISOString() });
}

export async function writeNextPrompt(content: string) {
  await fs.writeFile(PATHS.nextPrompt, content, "utf-8");
}

export async function readAgentRules(): Promise<string> {
  return fs.readFile(PATHS.agentMd, "utf-8");
}

export async function stopExists(): Promise<boolean> {
  try {
    await fs.access(PATHS.stop);
    return true;
  } catch {
    return false;
  }
}

export async function writeStop() {
  await ensureDir(PATHS.stop);
  await fs.writeFile(PATHS.stop, new Date().toISOString(), "utf-8");
}

export async function clearStop() {
  try {
    await fs.unlink(PATHS.stop);
  } catch {
    // ignore
  }
}

export async function readSecrets(): Promise<{ CURSOR_API_KEY: string } | null> {
  try {
    const raw = await fs.readFile(PATHS.secrets, "utf-8");
    return SecretsSchema.parse(JSON.parse(raw));
  } catch {
    if (process.env.CURSOR_API_KEY) {
      return { CURSOR_API_KEY: process.env.CURSOR_API_KEY };
    }
    return null;
  }
}

export async function writeSecrets(apiKey: string) {
  await writeJsonFile(PATHS.secrets, { CURSOR_API_KEY: apiKey });
}

export async function readSecretsMasked(): Promise<{ hasKey: boolean; masked: string | null }> {
  const secrets = await readSecrets();
  if (!secrets?.CURSOR_API_KEY) return { hasKey: false, masked: null };
  const key = secrets.CURSOR_API_KEY;
  const masked = key.length <= 8 ? "••••••••" : `${key.slice(0, 4)}••••${key.slice(-4)}`;
  return { hasKey: true, masked };
}

export async function appendStreamEvent(
  filePath: string,
  event: StreamEvent
) {
  const parsed = StreamEventSchema.parse(event);
  await ensureDir(filePath);
  await fs.appendFile(filePath, JSON.stringify(parsed) + "\n", "utf-8");
}

export async function readStreamEvents(
  filePath: string,
  since?: string
): Promise<StreamEvent[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const events = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => StreamEventSchema.parse(JSON.parse(line)));
    if (!since) return events;
    const idx = events.findIndex((e) => e.ts === since);
    return idx >= 0 ? events.slice(idx + 1) : events;
  } catch {
    return [];
  }
}

export async function rotateLiveLog(maxLines = 500) {
  try {
    const raw = await fs.readFile(PATHS.live, "utf-8");
    const lines = raw.split("\n").filter(Boolean);
    if (lines.length <= maxLines) return;
    const trimmed = lines.slice(-maxLines).join("\n") + "\n";
    await fs.writeFile(PATHS.live, trimmed, "utf-8");
  } catch {
    // ignore
  }
}

export async function readPid(): Promise<number | null> {
  try {
    const raw = await fs.readFile(PATHS.agentPid, "utf-8");
    const pid = parseInt(raw.trim(), 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

export async function writePid(pid: number) {
  await ensureDir(PATHS.agentPid);
  await fs.writeFile(PATHS.agentPid, String(pid), "utf-8");
}

export async function clearPid() {
  try {
    await fs.unlink(PATHS.agentPid);
  } catch {
    // ignore
  }
}

export function chatTranscriptPath(chatId: string) {
  return path.join(PATHS.chatsDir, `${chatId}.jsonl`);
}

async function removePath(target: string) {
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function clearDirectory(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map((entry) =>
        fs.rm(path.join(dir, entry.name), { recursive: true, force: true })
      )
    );
  } catch {
    // ignore missing directory
  }
}

export async function resetAllData() {
  const defaultState = StateSchema.parse({
    updated_at: new Date().toISOString(),
  });

  await writeJsonFile(PATHS.stateJson, defaultState);
  await writeQuestions({ pending: [], resolved: [] });
  await writeJsonFile(PATHS.uiBlocks, { blocks: [] });
  await writeChats({ sessions: [] });
  await clearDirectory(PATHS.chatsDir);
  await fs.writeFile(PATHS.journal, "# Learnpad Journal\n", "utf-8");
  await writeNextPrompt("# Next Task\n\nRun setup wizard.\n");
  await clearAgentPause();
  await removePath(PATHS.live);
  await removePath(PATHS.autoRestart);
  await removePath(PATHS.profitPlan);
  await clearDirectory(PATHS.product);
  await clearDirectory(PATHS.resources);
  await clearDirectory(PATHS.generated);
  await clearPid();
  await clearStop();
}

export { PATHS, REPO_ROOT };
