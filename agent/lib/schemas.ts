import { z } from "zod";

export const StateSchema = z.object({
  phase: z.enum(["discover", "build", "polish", "done"]).default("discover"),
  status: z
    .enum(["idle", "running", "waiting_for_user", "error"])
    .default("idle"),
  goal: z.string().default(""),
  agent_id: z.string().nullable().default(null),
  next_action: z.string().default("Run setup wizard"),
  self_prompting: z.boolean().default(true),
  questions_pending: z.boolean().default(false),
  loop_count: z.number().int().nonnegative().default(0),
  updated_at: z.string().default(""),
});

export type AppState = z.infer<typeof StateSchema>;

export const ConfigSchema = z.object({
  self_prompting: z.boolean().default(true),
  self_prompting_recommended: z.boolean().default(true),
  model: z.string().default("composer-2.5"),
  question_timeout_hours: z.number().positive().default(4),
  wait_gate: z
    .object({
      recheck_intervals_hours: z.array(z.number().positive()).default([2, 4, 8, 12, 24]),
    })
    .default({ recheck_intervals_hours: [2, 4, 8, 12, 24] }),
  guardrails: z
    .object({
      require_approval_for: z.array(z.string()).default(["spending", "paid_services"]),
    })
    .default({ require_approval_for: ["spending", "paid_services"] }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export const QuestionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string().nullable().default(null),
});

export const QuestionsSchema = z.object({
  pending: z.array(QuestionItemSchema).default([]),
  resolved: z.array(QuestionItemSchema).default([]),
});

export type Questions = z.infer<typeof QuestionsSchema>;

export const UiBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal("stat"),
    value: z.union([z.string(), z.number()]),
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal("checklist"),
    items: z.array(z.object({ label: z.string(), done: z.boolean() })),
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal("links"),
    items: z.array(z.object({ label: z.string(), href: z.string() })),
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal("table"),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    id: z.string(),
    title: z.string(),
    type: z.literal("markdown"),
    content: z.string(),
  }),
]);

export const UiBlocksSchema = z.object({
  blocks: z.array(UiBlockSchema).default([]),
});

export type UiBlock = z.infer<typeof UiBlockSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  agent_id: z.string().nullable(),
  created_at: z.string(),
  last_message_at: z.string(),
  status: z.enum(["idle", "running", "error"]).default("idle"),
});

export const ChatsSchema = z.object({
  sessions: z.array(ChatSessionSchema).default([]),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const StreamEventSchema = z.object({
  ts: z.string(),
  source: z.enum(["loop", "chat"]),
  chatId: z.string().optional(),
  type: z.enum(["user", "assistant", "thinking", "tool_call", "status", "error"]),
  text: z.string().optional(),
  tool: z.string().optional(),
});

export type StreamEvent = z.infer<typeof StreamEventSchema>;

export const SecretsSchema = z.object({
  CURSOR_API_KEY: z.string().min(1),
});
