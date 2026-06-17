import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  clearPid,
  clearStop,
  readPid,
  writePid,
  writeState,
  writeStop,
  PATHS,
  REPO_ROOT,
} from "./state";

export type AgentProcessStatus = "running" | "stopped" | "stale";

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function getAgentStatus(): Promise<{
  status: AgentProcessStatus;
  pid: number | null;
}> {
  const pid = await readPid();
  if (!pid) return { status: "stopped", pid: null };
  if (isProcessAlive(pid)) return { status: "running", pid };
  await clearPid();
  return { status: "stale", pid: null };
}

export async function startAgent(): Promise<{
  started: boolean;
  alreadyRunning: boolean;
  pid?: number;
}> {
  const current = await getAgentStatus();
  if (current.status === "running" && current.pid) {
    return { started: false, alreadyRunning: true, pid: current.pid };
  }

  await clearStop();
  await clearPid();

  const orchestratorPath = path.join(REPO_ROOT, "agent", "orchestrator.ts");
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", orchestratorPath],
    {
      cwd: REPO_ROOT,
      detached: true,
      stdio: "ignore",
      env: { ...process.env },
    }
  );

  child.unref();

  if (!child.pid) {
    throw new Error("Failed to spawn agent process");
  }

  await writePid(child.pid);
  await writeState({ status: "running" });

  return { started: true, alreadyRunning: false, pid: child.pid };
}

export async function stopAgent(): Promise<void> {
  await writeStop();
  const pid = await readPid();

  if (pid && isProcessAlive(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // ignore
    }

    await new Promise<void>((resolve) => {
      const deadline = setTimeout(() => {
        try {
          if (pid && isProcessAlive(pid)) process.kill(pid, "SIGKILL");
        } catch {
          // ignore
        }
        resolve();
      }, 5000);

      const interval = setInterval(() => {
        if (!isProcessAlive(pid)) {
          clearTimeout(deadline);
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  }

  await clearPid();
  await writeState({ status: "idle" });

  try {
    if (fs.existsSync(PATHS.stop)) {
      // keep STOP until next start clears it
    }
  } catch {
    // ignore
  }
}
