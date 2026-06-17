import { REPO_ROOT } from "./paths";
import type { AgentOptions, SendOptions } from "@cursor/sdk";

const DEFAULT_MODEL = "composer-2";

export function resolveModelId(model?: string): string {
  const id = model?.trim();
  return id || DEFAULT_MODEL;
}

export function buildAgentOptions(apiKey: string, model?: string): AgentOptions {
  return {
    apiKey,
    model: { id: resolveModelId(model) },
    local: { cwd: REPO_ROOT },
  };
}

export function buildSendOptions(model?: string): SendOptions {
  return {
    model: { id: resolveModelId(model) },
    // Clear wedged local runs left after a crashed or interrupted loop.
    local: { force: true },
  };
}
