import { NextResponse } from "next/server";
import { readQuestions, resolveQuestion } from "@/agent/lib/state";

export async function POST(request: Request) {
  const { answers } = await request.json();
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "answers array required" }, { status: 400 });
  }

  const resolved: string[] = [];
  const errors: string[] = [];

  for (const entry of answers) {
    const { id, answer } = entry ?? {};
    if (!id || !answer || typeof answer !== "string" || !answer.trim()) {
      errors.push(`Invalid entry for id: ${id ?? "unknown"}`);
      continue;
    }
    const ok = await resolveQuestion(id, answer);
    if (ok) resolved.push(id);
    else errors.push(`Question not found: ${id}`);
  }

  const updated = await readQuestions();
  return NextResponse.json({ ...updated, resolved_ids: resolved, errors });
}
