import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { families, familyMembers, invites } from "@/db/schema";
import { db } from "@/lib/db";
import { getRequestUser, handleApiError } from "@/lib/api-auth";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ token: string }> };

async function findInvite(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await db.select({ invite: invites, familyName: families.name }).from(invites).innerJoin(families, eq(families.id, invites.familyId)).where(eq(invites.tokenHash, tokenHash)).limit(1);
  if (!row || (row.invite.status === "pending" && row.invite.expiresAt.getTime() < Date.now()) || !["pending", "accepted"].includes(row.invite.status)) return null;
  return row;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const row = await findInvite(token);
    if (!row) return NextResponse.json({ error: "Undangan tidak valid atau sudah kedaluwarsa" }, { status: 404 });
    return NextResponse.json({ email: row.invite.email, familyName: row.familyName, expiresAt: row.invite.expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
    const { token } = await context.params;
    const row = await findInvite(token);
    if (!row) return NextResponse.json({ error: "Undangan tidak valid atau sudah kedaluwarsa" }, { status: 404 });
    if (user.email.toLowerCase() !== row.invite.email.toLowerCase()) return NextResponse.json({ error: `Masuk menggunakan ${row.invite.email} untuk menerima undangan ini` }, { status: 403 });
    const existingMembership = await db.select({ familyId: familyMembers.familyId }).from(familyMembers).where(eq(familyMembers.userId, user.id));
    const alreadyMember = existingMembership.some((membership) => membership.familyId === row.invite.familyId);
    await db.transaction(async (tx) => {
      const [targetMembership] = await tx.select({ id: familyMembers.id }).from(familyMembers).where(and(eq(familyMembers.userId, user.id), eq(familyMembers.familyId, row.invite.familyId))).limit(1);
      if (!targetMembership) await tx.insert(familyMembers).values({ id: crypto.randomUUID(), familyId: row.invite.familyId, userId: user.id, displayName: user.name || "Orang tua", role: "member", inviteStatus: "accepted", createdAt: new Date() });
      await tx.update(invites).set({ status: "accepted" }).where(and(eq(invites.id, row.invite.id), eq(invites.status, "pending")));
    });
    return NextResponse.json({ ok: true, familyName: row.familyName, alreadyMember });
  } catch (error) {
    return handleApiError(error);
  }
}
