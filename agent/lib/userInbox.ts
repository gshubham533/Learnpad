import fs from "fs/promises";
import path from "path";
import { PATHS } from "./paths";
import { UserInboxSchema, type UserInbox } from "./schemas";

async function ensureDir() {
  await fs.mkdir(path.dirname(PATHS.userInbox), { recursive: true });
}

async function readInbox(): Promise<UserInbox> {
  try {
    const raw = await fs.readFile(PATHS.userInbox, "utf-8");
    return UserInboxSchema.parse(JSON.parse(raw));
  } catch {
    return UserInboxSchema.parse({ messages: [] });
  }
}

async function writeInbox(inbox: UserInbox) {
  await ensureDir();
  await fs.writeFile(PATHS.userInbox, JSON.stringify(inbox, null, 2) + "\n", "utf-8");
}

export async function appendUserContext(text: string) {
  const inbox = await readInbox();
  const next = UserInboxSchema.parse({
    messages: [
      ...inbox.messages,
      { ts: new Date().toISOString(), text: text.trim(), read: false },
    ],
  });
  await writeInbox(next);
}

export async function consumeUnreadContextForPrompt(): Promise<string> {
  const inbox = await readInbox();
  const unread = inbox.messages.filter((m) => !m.read);
  if (unread.length === 0) return "";

  const block = unread.map((m) => `- [${m.ts}] ${m.text}`).join("\n");
  const next = UserInboxSchema.parse({
    messages: inbox.messages.map((m) => ({ ...m, read: true })),
  });
  await writeInbox(next);
  return block;
}

export async function readUserInbox(): Promise<UserInbox> {
  return readInbox();
}
