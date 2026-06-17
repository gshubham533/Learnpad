import { NextResponse } from "next/server";
import { readJournal } from "@/agent/lib/state";

export async function GET() {
  const journal = await readJournal();
  return NextResponse.json({ journal });
}
