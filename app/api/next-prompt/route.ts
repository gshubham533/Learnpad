import { NextResponse } from "next/server";
import { readNextPrompt } from "@/agent/lib/state";

export async function GET() {
  const content = await readNextPrompt();
  return NextResponse.json({ content });
}
