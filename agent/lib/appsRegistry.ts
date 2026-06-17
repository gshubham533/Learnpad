import fs from "fs/promises";
import path from "path";
import { PATHS } from "./paths";
import { AppsRegistrySchema, type AppsRegistry } from "./schemas";

async function readRegistry(): Promise<AppsRegistry> {
  try {
    const raw = await fs.readFile(PATHS.apps, "utf-8");
    return AppsRegistrySchema.parse(JSON.parse(raw));
  } catch {
    return AppsRegistrySchema.parse({ apps: [] });
  }
}

export async function readAppsRegistry(): Promise<AppsRegistry> {
  return readRegistry();
}

export async function writeAppsRegistry(registry: AppsRegistry) {
  await fs.mkdir(path.dirname(PATHS.apps), { recursive: true });
  await fs.writeFile(PATHS.apps, JSON.stringify(registry, null, 2) + "\n", "utf-8");
}
