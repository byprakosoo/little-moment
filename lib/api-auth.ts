import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { familyMembers, invites } from "@/db/schema";

export async function getRequestUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

async function ensureInviteMembership(user: { id: string; email: string; name?: string }) {
  const [existingMembership] = await db.select().from(familyMembers).where(eq(familyMembers.userId, user.id)).limit(1);
  if (existingMembership) return existingMembership;

  const now = new Date();
  const [invite] = await db.select().from(invites)
    .where(and(
      eq(invites.email, user.email.toLowerCase()),
      or(eq(invites.status, "accepted"), and(eq(invites.status, "pending"), gt(invites.expiresAt, now))),
    ))
    .orderBy(desc(invites.createdAt))
    .limit(1);
  if (!invite) return null;

  await db.transaction(async (tx) => {
    const [membership] = await tx.select().from(familyMembers).where(eq(familyMembers.userId, user.id)).limit(1);
    if (membership) return;
    await tx.insert(familyMembers).values({ id: crypto.randomUUID(), familyId: invite.familyId, userId: user.id, displayName: user.name || "Orang tua", role: "member", inviteStatus: "accepted", createdAt: now });
    if (invite.status === "pending") await tx.update(invites).set({ status: "accepted" }).where(eq(invites.id, invite.id));
  });

  const [membership] = await db.select().from(familyMembers).where(eq(familyMembers.userId, user.id)).limit(1);
  return membership || null;
}

export async function requireFamily(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const membership = await ensureInviteMembership(user);
  if (!membership) return { response: NextResponse.json({ error: "Family not found" }, { status: 404 }) } as const;
  return { user, membership } as const;
}

export function handleApiError(error: unknown) {
  console.error("Little Moment API error", error);
  const message = process.env.NODE_ENV === "development" ? String(error) : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
