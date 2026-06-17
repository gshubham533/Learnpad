import { NextResponse } from "next/server";
import { readAppsRegistry } from "@/agent/lib/appsRegistry";

export async function GET() {
  const registry = await readAppsRegistry();
  return NextResponse.json(registry);
}
