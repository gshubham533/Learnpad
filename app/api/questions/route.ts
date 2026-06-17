import { NextResponse } from "next/server";
import { clearAgentPause, readQuestions, writeQuestions, writeState } from "@/agent/lib/state";

export async function GET() {
  const questions = await readQuestions();
  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  const { id, answer } = await request.json();
  if (!id || !answer) {
    return NextResponse.json({ error: "id and answer required" }, { status: 400 });
  }

  const questions = await readQuestions();
  const idx = questions.pending.findIndex((q) => q.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const item = { ...questions.pending[idx], answer };
  const pending = questions.pending.filter((q) => q.id !== id);
  const resolved = [...questions.resolved, item];

  const updated = await writeQuestions({ pending, resolved });

  if (pending.length === 0) {
    await clearAgentPause();
    await writeState({
      questions_pending: false,
      status: "idle",
    });
  } else {
    await writeState({
      questions_pending: true,
      status: "waiting_for_user",
    });
  }

  return NextResponse.json(updated);
}
