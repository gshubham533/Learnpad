import { NextResponse } from "next/server";
import { readSecretsMasked, writeSecrets } from "@/agent/lib/state";

export async function GET() {
  const masked = await readSecretsMasked();
  return NextResponse.json(masked);
}

export async function POST(request: Request) {
  const { apiKey } = await request.json();
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "apiKey required" }, { status: 400 });
  }
  await writeSecrets(apiKey.trim());
  return NextResponse.json({ ok: true });
}
