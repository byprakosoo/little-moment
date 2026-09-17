import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { invites } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const body = await request.json() as { email?: string };
    if (!body.email?.includes("@")) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await db.insert(invites).values({ id: crypto.randomUUID(), familyId: auth.membership.familyId, email: body.email.toLowerCase().trim(), tokenHash, status: "pending", expiresAt: new Date(Date.now() + 7 * 86400000), createdAt: new Date() });
    return NextResponse.json({ status: "pending", token: rawToken }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const rows = await db.select().from(invites).where(and(eq(invites.familyId, auth.membership.familyId), eq(invites.status, "pending"))).orderBy(desc(invites.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
