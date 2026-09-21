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
    const scope = new URL(request.url).searchParams.get("scope");
    const [[family], [child], members, [pendingInvite]] = await Promise.all([
      db.select().from(families).where(eq(families.id, membership.familyId)).limit(1),
      db.select().from(children).where(eq(children.familyId, membership.familyId)).limit(1),
      db.select({ id: familyMembers.id, familyId: familyMembers.familyId, userId: familyMembers.userId, displayName: familyMembers.displayName, role: familyMembers.role, inviteStatus: familyMembers.inviteStatus, createdAt: familyMembers.createdAt, email: userTable.email }).from(familyMembers).leftJoin(userTable, eq(userTable.id, familyMembers.userId)).where(eq(familyMembers.familyId, membership.familyId)).orderBy(asc(familyMembers.createdAt)),
      db.select({ email: invites.email }).from(invites).where(and(eq(invites.familyId, membership.familyId), eq(invites.status, "pending"))).orderBy(desc(invites.createdAt)).limit(1),
    ]);
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });
    if (scope === "context") {
      return NextResponse.json({ currentUserId: context.user.id, family, child, members, pendingInviteEmail: pendingInvite?.email || null }, { headers: { "Cache-Control": "private, no-store" } });
    }
    // Legacy callers can still request the complete payload. New clients use
    // the context scope followed by the paginated entries feed.
    const rows = await db.select({ entry: entriesTable, photo: photos }).from(entriesTable).leftJoin(photos, eq(photos.entryId, entriesTable.id)).where(eq(entriesTable.familyId, membership.familyId)).orderBy(desc(entriesTable.happenedAt), asc(photos.sortOrder));
    const memberByUserId = new Map(members.map((member) => [member.userId, member]));
    const grouped = new Map<string, { id: string; type: string; title: string; body: string; happenedAt: string; author: string; photos: { id: string; label: string; status: "uploaded" | "ready" | "error"; previewUrl?: string }[]; updatedAt: string }>();
    for (const row of rows) {
      const authorMember = memberByUserId.get(row.entry.authorId);
      const author = authorMember?.role === "owner" ? family.ownerLabel : authorMember?.role === "member" ? family.memberLabel : "Orang tua";
      const current = grouped.get(row.entry.id) ?? { id: row.entry.id, type: row.entry.type, title: row.entry.title, body: row.entry.body, happenedAt: row.entry.happenedAt, author, photos: [], updatedAt: row.entry.updatedAt.toISOString() };
      if (row.photo) current.photos.push({ id: row.photo.id, label: row.photo.altText || `Foto dari cerita tanggal ${row.entry.happenedAt}`, status: row.photo.status as "uploaded" | "ready" | "error", previewUrl: `/api/photos/${row.photo.id}` });
      grouped.set(row.entry.id, current);
    }
    return NextResponse.json({ currentUserId: context.user.id, family, child, members, pendingInviteEmail: pendingInvite?.email || null, entries: [...grouped.values()] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
