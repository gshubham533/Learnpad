import { NextResponse } from "next/server";
import { readConfig, readQuestions, resolveQuestion } from "@/agent/lib/state";
import { countBlockingTasks } from "@/agent/lib/taskBlocking";

export async function GET() {
  const [questions, config] = await Promise.all([readQuestions(), readConfig()]);
  const { blocking, optional } = countBlockingTasks(questions, config.workflow_mode);
  return NextResponse.json({
    ...questions,
    meta: {
      blocking,
      optional,
      workflow_mode: config.workflow_mode,
    },
  });
}

export async function POST(request: Request) {
  const { id, answer } = await request.json();
  if (!id || !answer) {
    return NextResponse.json({ error: "id and answer required" }, { status: 400 });
  }

  const ok = await resolveQuestion(id, answer);
  if (!ok) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const updated = await readQuestions();
  return NextResponse.json(updated);
}
