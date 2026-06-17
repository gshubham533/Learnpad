import { z } from "zod";

export const StateSchema = z.object({
  phase: z.enum(["discover", "build", "polish", "done"]).default("discover"),
  status: z
    .enum(["idle", "running", "waiting_for_user", "error"])
    .default("idle"),
  goal: z.string().default(""),
  user_name: z.string().default(""),
  agent_id: z.string().nullable().default(null),
  next_action: z.string().default("Run setup wizard"),
  self_prompting: z.boolean().default(true),
  questions_pending: z.boolean().default(false),
  loop_count: z.number().int().nonnegative().default(0),
  updated_at: z.string().default(""),
});

export type AppState = z.infer<typeof StateSchema>;

export const WorkflowModeSchema = z.enum(["autonomous", "collaborative"]).default("autonomous");

export type WorkflowMode = z.infer<typeof WorkflowModeSchema>;

export const TaskPrioritySchema = z
  .enum(["critical", "normal", "deferred"])
  .default("normal");

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const ConfigSchema = z.object({
  self_prompting: z.boolean().default(true),
  self_prompting_recommended: z.boolean().default(true),
  workflow_mode: WorkflowModeSchema,
  require_plan_approval: z.boolean().default(false),
  model: z.string().default("composer-2.5"),
  question_timeout_hours: z.number().positive().default(4),
  auto_decide_on_timeout: z.boolean().default(false),
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
  stall_detection: z
    .object({
      enabled: z.boolean().default(true),
      no_activity_minutes: z.number().positive().default(15),
    })
    .default({ enabled: true, no_activity_minutes: 15 }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export const TaskKindSchema = z.enum([
  "user_input",
  "action_required",
  "external_wait",
  "system_error",
  "stuck",
]);

export type TaskKind = z.infer<typeof TaskKindSchema>;

export const PauseKindSchema = z.enum([
  "none",
  "user_input",
  "external_wait",
  "system_error",
  "stuck",
]);

export type PauseKind = z.infer<typeof PauseKindSchema>;

export const AgentPauseSchema = z.object({
  kind: PauseKindSchema.default("none"),
  title: z.string().default(""),
  summary: z.string().default(""),
  detail: z.string().default(""),
  since: z.string().default(""),
  next_when: z.string().default(""),
});

export type AgentPause = z.infer<typeof AgentPauseSchema>;

export const QuestionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string().nullable().default(null),
  kind: TaskKindSchema.default("user_input"),
  priority: TaskPrioritySchema.optional(),
  context: z.string().optional(),
  unblocks: z.string().optional(),
  created_at: z.string().optional(),
  edit_files: z
    .array(z.object({ label: z.string(), path: z.string() }))
    .optional(),
  accept_files: z.boolean().optional(),
  file_target: z.string().optional(),
  file_hint: z.string().optional(),
});

export const QuestionsSchema = z.object({
  pending: z.array(QuestionItemSchema).default([]),
  resolved: z.array(QuestionItemSchema).default([]),
});

export type Questions = z.infer<typeof QuestionsSchema>;

export const BacklogItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  phase: z.enum(["discover", "build", "polish"]).default("build"),
  detail: z.string().optional(),
});

export const BacklogSchema = z.object({
  items: z.array(BacklogItemSchema).default([]),
});

export type Backlog = z.infer<typeof BacklogSchema>;
export type BacklogItem = z.infer<typeof BacklogItemSchema>;

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

export const LoopContextSchema = z.object({
  goal: z.string(),
  status: z.string(),
  phase: z.string(),
  workflow_mode: WorkflowModeSchema,
  next_action: z.string(),
  next_prompt: z.string(),
  loop_count: z.number(),
  questions_pending: z.boolean(),
  blocking_task_count: z.number(),
  optional_task_count: z.number(),
  pending_tasks: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      priority: TaskPrioritySchema.optional(),
      kind: TaskKindSchema.optional(),
    })
  ),
  process_running: z.boolean(),
  journal_excerpt: z.string(),
});

export type LoopContext = z.infer<typeof LoopContextSchema>;

export const SecretsSchema = z.object({
  CURSOR_API_KEY: z.string().min(1),
});

export const UserInboxMessageSchema = z.object({
  ts: z.string(),
  text: z.string(),
  read: z.boolean().default(false),
});

export const UserInboxSchema = z.object({
  messages: z.array(UserInboxMessageSchema).default([]),
});

export type UserInbox = z.infer<typeof UserInboxSchema>;

export const AppRegistryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  local_path: z.string().optional(),
  status: z.enum(["dev", "deployed"]).default("dev"),
  updated_at: z.string(),
});

export const AppsRegistrySchema = z.object({
  apps: z.array(AppRegistryItemSchema).default([]),
});

export type AppsRegistry = z.infer<typeof AppsRegistrySchema>;
export type AppRegistryItem = z.infer<typeof AppRegistryItemSchema>;
