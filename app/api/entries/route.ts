import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { children, entries as entriesTable, photos } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const rows = await db.select({ entry: entriesTable, photo: photos }).from(entriesTable).leftJoin(photos, eq(photos.entryId, entriesTable.id)).where(eq(entriesTable.familyId, context.membership.familyId)).orderBy(desc(entriesTable.happenedAt), asc(photos.sortOrder));
    const grouped = new Map<string, { entry: typeof rows[number]["entry"]; photos: typeof photos.$inferSelect[] }>();
    for (const row of rows) {
      const current = grouped.get(row.entry.id) ?? { entry: row.entry, photos: [] };
      if (row.photo) current.photos.push(row.photo);
      grouped.set(row.entry.id, current);
    }
    return NextResponse.json([...grouped.values()]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const body = await request.json() as { childId?: string; type?: "story" | "milestone"; title?: string; body?: string; happenedAt?: string; photos?: { storageKey: string; mimeType: string; byteSize?: number; altText?: string; sortOrder?: number }[] };
    if ((!body.body?.trim() && !body.photos?.length) || !body.happenedAt) return NextResponse.json({ error: "body or at least one photo, and happenedAt are required" }, { status: 400 });
    const [child] = body.childId
      ? await db.select().from(children).where(eq(children.id, body.childId)).limit(1)
      : await db.select().from(children).where(eq(children.familyId, context.membership.familyId)).limit(1);
    if (!child || child.familyId !== context.membership.familyId) return NextResponse.json({ error: "Child not found" }, { status: 404 });
    const now = new Date();
    const entryId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(entriesTable).values({ id: entryId, familyId: context.membership.familyId, childId: child!.id, authorId: context.user.id, type: body.type || "story", title: body.title?.trim() || "", body: body.body?.trim() || "", happenedAt: body.happenedAt!, createdAt: now, updatedAt: now });
      if (body.photos?.length) await tx.insert(photos).values(body.photos.slice(0, 6).map((photo, index) => ({ id: crypto.randomUUID(), entryId, storageKey: photo.storageKey, mimeType: photo.mimeType, byteSize: photo.byteSize || 0, altText: photo.altText, sortOrder: photo.sortOrder ?? index, status: "uploaded", createdAt: now })));
    });
    return NextResponse.json({ id: entryId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
