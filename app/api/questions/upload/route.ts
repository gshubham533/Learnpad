import { NextResponse } from "next/server";
import path from "path";
import { readQuestions, resolveQuestion } from "@/agent/lib/state";
import {
  ResourcePathError,
  sanitizeFilename,
  writeResourceFile,
} from "@/agent/lib/resources";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const taskId = form.get("taskId");
    const file = form.get("file");

    if (typeof taskId !== "string" || !taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const questions = await readQuestions();
    const task = questions.pending.find((q) => q.id === taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (!task.accept_files) {
      return NextResponse.json({ error: "Task does not accept files" }, { status: 400 });
    }

    const folder = (task.file_target ?? "state/resources").replace(/\\/g, "/");
    const filename = sanitizeFilename(file.name);
    const relPath = path.posix.join(folder, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeResourceFile(relPath, buffer);

    const answer = `Uploaded: ${relPath}`;
    const ok = await resolveQuestion(taskId, answer);
    if (!ok) {
      return NextResponse.json({ error: "Failed to resolve task" }, { status: 500 });
    }

    const updated = await readQuestions();
    return NextResponse.json({ ok: true, path: relPath, answer, ...updated });
  } catch (err) {
    if (err instanceof ResourcePathError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
