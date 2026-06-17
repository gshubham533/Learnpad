import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/agent/lib/state";

export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const config = await writeConfig(body);
  return NextResponse.json(config);
}
