import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { entries as entriesTable, families, familyMembers, photos } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    const [[entry], photoRows, [family], members] = await Promise.all([
      db.select().from(entriesTable).where(and(eq(entriesTable.id, id), eq(entriesTable.familyId, auth.membership.familyId))).limit(1),
      db.select().from(photos).where(eq(photos.entryId, id)).orderBy(asc(photos.sortOrder)),
      db.select({ ownerLabel: families.ownerLabel, memberLabel: families.memberLabel }).from(families).where(eq(families.id, auth.membership.familyId)).limit(1),
      db.select({ userId: familyMembers.userId, role: familyMembers.role }).from(familyMembers).where(eq(familyMembers.familyId, auth.membership.familyId)),
    ]);
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    const authorMember = members.find((member) => member.userId === entry.authorId);
    const author = authorMember?.role === "owner" ? family?.ownerLabel : authorMember?.role === "member" ? family?.memberLabel : "Orang tua";
    return NextResponse.json({ id: entry.id, type: entry.type, title: entry.title, body: entry.body, happenedAt: entry.happenedAt, author: author || "Orang tua", authorId: entry.authorId, photos: photoRows.map((photo) => ({ id: photo.id, label: photo.altText || `Foto dari cerita tanggal ${entry.happenedAt}`, status: photo.status, previewUrl: `/api/photos/${photo.id}`, mimeType: photo.mimeType, byteSize: photo.byteSize })), updatedAt: entry.updatedAt.toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    const body = await request.json() as { type?: "story" | "milestone"; title?: string; body?: string; happenedAt?: string; photos?: { id?: string; storageKey?: string; mimeType?: string; byteSize?: number; altText?: string; sortOrder?: number; dataUrl?: string }[] };
    if ((!body.body?.trim() && !body.photos?.length) || !body.happenedAt) return NextResponse.json({ error: "body or at least one photo, and happenedAt are required" }, { status: 400 });
    const [existing] = await db.select({ id: entriesTable.id }).from(entriesTable).where(and(eq(entriesTable.id, id), eq(entriesTable.familyId, auth.membership.familyId))).limit(1);
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    const now = new Date();
    const currentPhotos = await db.select().from(photos).where(eq(photos.entryId, id));
    const currentPhotoIds = new Set(currentPhotos.map((photo) => photo.id));
    const unknownExistingPhoto = body.photos?.some((photo) => photo.id && !currentPhotoIds.has(photo.id));
    if (unknownExistingPhoto) return NextResponse.json({ error: "Photo does not belong to this entry" }, { status: 400 });
    if (body.photos?.some((photo) => !photo.id && !photo.dataUrl)) return NextResponse.json({ error: "New photos must include image data" }, { status: 400 });
    await db.transaction(async (tx) => {
      await tx.update(entriesTable).set({ type: body.type || "story", title: body.title?.trim() || "", body: body.body?.trim() || "", happenedAt: body.happenedAt, updatedAt: now }).where(eq(entriesTable.id, id));
      await tx.delete(photos).where(eq(photos.entryId, id));
      if (body.photos?.length) await tx.insert(photos).values(body.photos.slice(0, 6).map((photo, index) => {
        const existingPhoto = photo.id ? currentPhotos.find((current) => current.id === photo.id) : undefined;
        return existingPhoto
          ? { ...existingPhoto, sortOrder: photo.sortOrder ?? index }
          : { id: crypto.randomUUID(), entryId: id, storageKey: photo.storageKey || `inline/${crypto.randomUUID()}`, mimeType: photo.mimeType || "image/jpeg", byteSize: photo.byteSize || 0, altText: photo.altText, dataUrl: photo.dataUrl, sortOrder: photo.sortOrder ?? index, status: "uploaded", createdAt: now };
      }));
    });
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
