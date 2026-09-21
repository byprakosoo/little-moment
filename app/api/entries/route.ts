import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, inArray, like, lt, lte, or } from "drizzle-orm";
import { children, entries as entriesTable, families, familyMembers, photos, user as userTable } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const params = new URL(request.url).searchParams;
    const limit = Math.min(20, Math.max(1, Number(params.get("limit") || 20)));
    const query = params.get("q")?.trim();
    const from = params.get("from");
    const to = params.get("to");
    const type = params.get("type");
    const authorId = params.get("authorId");
    const cursor = params.get("cursor");
    const filterConditions = [eq(entriesTable.familyId, context.membership.familyId)];
    if (query) filterConditions.push(or(like(entriesTable.title, `%${query}%`), like(entriesTable.body, `%${query}%`))!);
    if (from) filterConditions.push(gte(entriesTable.happenedAt, from));
    if (to) filterConditions.push(lte(entriesTable.happenedAt, to));
    if (type === "story" || type === "milestone") filterConditions.push(eq(entriesTable.type, type));
    if (authorId) filterConditions.push(eq(entriesTable.authorId, authorId));
    const countConditions = [...filterConditions];
    if (cursor) {
      const separator = cursor.indexOf("|");
      const cursorDate = separator >= 0 ? cursor.slice(0, separator) : "";
      const cursorId = separator >= 0 ? cursor.slice(separator + 1) : "";
      if (cursorDate && cursorId) filterConditions.push(or(lt(entriesTable.happenedAt, cursorDate), and(eq(entriesTable.happenedAt, cursorDate), lt(entriesTable.id, cursorId)))!);
    }
    const where = and(...filterConditions);
    const countWhere = and(...countConditions);
    const [entryRows, members, totalRows, [family]] = await Promise.all([
      db.select().from(entriesTable).where(where).orderBy(desc(entriesTable.happenedAt), desc(entriesTable.id)).limit(limit + 1),
      db.select({ id: familyMembers.userId, role: familyMembers.role, email: userTable.email }).from(familyMembers).leftJoin(userTable, eq(userTable.id, familyMembers.userId)).where(eq(familyMembers.familyId, context.membership.familyId)),
      db.select({ total: count() }).from(entriesTable).where(countWhere),
      db.select({ ownerLabel: families.ownerLabel, memberLabel: families.memberLabel }).from(families).where(eq(families.id, context.membership.familyId)).limit(1),
    ]);
    const hasMore = entryRows.length > limit;
    const selectedEntries = entryRows.slice(0, limit);
    const selectedIds = selectedEntries.map((entry) => entry.id);
    const photoRows = selectedIds.length ? await db.select().from(photos).where(inArray(photos.entryId, selectedIds)).orderBy(asc(photos.sortOrder)) : [];
    const memberByUserId = new Map(members.map((member) => [member.id, member]));
    const labels = family || { ownerLabel: "Baba", memberLabel: "Bubu" };
    const photoByEntry = new Map<string, typeof photoRows>();
    for (const photo of photoRows) photoByEntry.set(photo.entryId, [...(photoByEntry.get(photo.entryId) || []), photo]);
    const result = selectedEntries.map((entry) => {
      const authorMember = memberByUserId.get(entry.authorId);
      const author = authorMember?.role === "owner" ? labels.ownerLabel : authorMember?.role === "member" ? labels.memberLabel : "Orang tua";
      return { id: entry.id, type: entry.type, title: entry.title, body: entry.body, happenedAt: entry.happenedAt, author, authorId: entry.authorId, photos: (photoByEntry.get(entry.id) || []).map((photo) => ({ id: photo.id, label: photo.altText || `Foto dari cerita tanggal ${entry.happenedAt}`, status: photo.status, previewUrl: `/api/photos/${photo.id}`, mimeType: photo.mimeType, byteSize: photo.byteSize })), updatedAt: entry.updatedAt.toISOString() };
    });
    const last = selectedEntries[selectedEntries.length - 1];
    return NextResponse.json({ entries: result, nextCursor: hasMore && last ? `${last.happenedAt}|${last.id}` : null, total: Number(totalRows[0]?.total || 0), authors: members.map((member) => ({ id: member.id, label: member.role === "owner" ? labels.ownerLabel : member.role === "member" ? labels.memberLabel : "Orang tua" })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const body = await request.json() as { childId?: string; type?: "story" | "milestone"; title?: string; body?: string; happenedAt?: string; photos?: { storageKey: string; mimeType: string; byteSize?: number; altText?: string; sortOrder?: number; dataUrl?: string }[] };
    if ((!body.body?.trim() && !body.photos?.length) || !body.happenedAt) return NextResponse.json({ error: "body or at least one photo, and happenedAt are required" }, { status: 400 });
    const [child] = body.childId
      ? await db.select().from(children).where(eq(children.id, body.childId)).limit(1)
      : await db.select().from(children).where(eq(children.familyId, context.membership.familyId)).limit(1);
    if (!child || child.familyId !== context.membership.familyId) return NextResponse.json({ error: "Child not found" }, { status: 404 });
    const now = new Date();
    const entryId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(entriesTable).values({ id: entryId, familyId: context.membership.familyId, childId: child!.id, authorId: context.user.id, type: body.type || "story", title: body.title?.trim() || "", body: body.body?.trim() || "", happenedAt: body.happenedAt!, createdAt: now, updatedAt: now });
      if (body.photos?.length) await tx.insert(photos).values(body.photos.slice(0, 6).map((photo, index) => ({ id: crypto.randomUUID(), entryId, storageKey: photo.storageKey, mimeType: photo.mimeType, byteSize: photo.byteSize || 0, altText: photo.altText, dataUrl: photo.dataUrl, sortOrder: photo.sortOrder ?? index, status: "uploaded", createdAt: now })));
    });
    return NextResponse.json({ id: entryId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
