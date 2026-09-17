import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured) return NextResponse.json({ ok: true, database: "not-configured", mode: "mock" });
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: "connected" });
  } catch {
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
