import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { children, entries as entriesTable, families, familyMembers, invites, photos, user as userTable } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const { membership } = context;
    const [family] = await db.select().from(families).where(eq(families.id, membership.familyId)).limit(1);
    const [child] = await db.select().from(children).where(eq(children.familyId, membership.familyId)).limit(1);
    const members = await db.select({ id: familyMembers.id, familyId: familyMembers.familyId, userId: familyMembers.userId, displayName: familyMembers.displayName, role: familyMembers.role, inviteStatus: familyMembers.inviteStatus, createdAt: familyMembers.createdAt, email: userTable.email }).from(familyMembers).leftJoin(userTable, eq(userTable.id, familyMembers.userId)).where(eq(familyMembers.familyId, membership.familyId)).orderBy(asc(familyMembers.createdAt));
    const [pendingInvite] = await db.select({ email: invites.email }).from(invites).where(and(eq(invites.familyId, membership.familyId), eq(invites.status, "pending"))).orderBy(desc(invites.createdAt)).limit(1);
    const rows = await db.select({ entry: entriesTable, photo: photos }).from(entriesTable).leftJoin(photos, eq(photos.entryId, entriesTable.id)).where(eq(entriesTable.familyId, membership.familyId)).orderBy(desc(entriesTable.happenedAt), asc(photos.sortOrder));
    const grouped = new Map<string, { id: string; type: string; title: string; body: string; happenedAt: string; author: string; photos: { id: string; label: string; status: "uploaded" | "ready" | "error"; previewUrl?: string }[]; updatedAt: string }>();
    for (const row of rows) {
      const current = grouped.get(row.entry.id) ?? { id: row.entry.id, type: row.entry.type, title: row.entry.title, body: row.entry.body, happenedAt: row.entry.happenedAt, author: row.entry.authorId === context.user.id ? "Kamu" : "Pasangan", photos: [], updatedAt: row.entry.updatedAt.toISOString() };
      if (row.photo) current.photos.push({ id: row.photo.id, label: row.photo.altText || `Foto dari cerita tanggal ${row.entry.happenedAt}`, status: row.photo.status as "uploaded" | "ready" | "error", previewUrl: row.photo.dataUrl || undefined });
      grouped.set(row.entry.id, current);
    }
    return NextResponse.json({ family, child, members, pendingInviteEmail: pendingInvite?.email || null, entries: [...grouped.values()] });
  } catch (error) {
    return handleApiError(error);
  }
}
