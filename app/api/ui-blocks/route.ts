import { NextResponse } from "next/server";
import { readUiBlocks } from "@/agent/lib/state";

export async function GET() {
  const blocks = await readUiBlocks();
  return NextResponse.json(blocks);
}
