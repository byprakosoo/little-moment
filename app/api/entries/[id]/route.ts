import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { entries as entriesTable, photos } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    const body = await request.json() as { type?: "story" | "milestone"; title?: string; body?: string; happenedAt?: string; photos?: unknown[] };
    if ((!body.body?.trim() && !body.photos?.length) || !body.happenedAt) return NextResponse.json({ error: "body or at least one photo, and happenedAt are required" }, { status: 400 });
    const [existing] = await db.select({ id: entriesTable.id }).from(entriesTable).where(and(eq(entriesTable.id, id), eq(entriesTable.familyId, auth.membership.familyId))).limit(1);
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    await db.update(entriesTable).set({ type: body.type || "story", title: body.title?.trim() || "", body: body.body?.trim() || "", happenedAt: body.happenedAt, updatedAt: new Date() }).where(eq(entriesTable.id, id));
    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    const [existing] = await db.select({ id: entriesTable.id }).from(entriesTable).where(and(eq(entriesTable.id, id), eq(entriesTable.familyId, auth.membership.familyId))).limit(1);
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    await db.delete(entriesTable).where(eq(entriesTable.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
