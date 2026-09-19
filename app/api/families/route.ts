import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { children as childrenTable, families, familyMembers } from "@/db/schema";
import { getRequestUser, handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json() as { familyName?: string; nickname?: string; birthDate?: string };
    if (!body.nickname || !body.birthDate) return NextResponse.json({ error: "nickname and birthDate are required" }, { status: 400 });
    const nickname = body.nickname;
    const birthDate = body.birthDate;

    // OAuth redirects every sign-in through onboarding. Reuse the existing
    // family/child instead of creating duplicates when a returning user posts
    // the form again (or when onboarding is submitted twice).
    const [existingMembership] = await db.select({ familyId: familyMembers.familyId }).from(familyMembers).where(eq(familyMembers.userId, user.id)).orderBy(desc(familyMembers.createdAt)).limit(1);
    if (existingMembership) {
      const [existingChild] = await db.select({ id: childrenTable.id }).from(childrenTable).where(eq(childrenTable.familyId, existingMembership.familyId)).limit(1);
      if (existingChild) return NextResponse.json({ familyId: existingMembership.familyId, childId: existingChild.id, existing: true });

      const childId = crypto.randomUUID();
      const now = new Date();
      await db.insert(childrenTable).values({ id: childId, familyId: existingMembership.familyId, nickname: nickname.trim(), birthDate, createdAt: now, updatedAt: now });
      return NextResponse.json({ familyId: existingMembership.familyId, childId, existing: true }, { status: 200 });
    }

    const now = new Date();
    const familyId = crypto.randomUUID();
    const childId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(families).values({ id: familyId, name: body.familyName || "Keluarga Kecil", createdAt: now, updatedAt: now });
      await tx.insert(familyMembers).values({ id: crypto.randomUUID(), familyId, userId: user.id, displayName: user.name || "Orang tua", role: "owner", inviteStatus: "accepted", createdAt: now });
      await tx.insert(childrenTable).values({ id: childId, familyId, nickname: nickname.trim(), birthDate, createdAt: now, updatedAt: now });
    });
    return NextResponse.json({ familyId, childId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    const body = await request.json() as { name?: string };
    const name = body.name?.trim() || "";
    if (name.length < 2 || name.length > 160) return NextResponse.json({ error: "Nama keluarga harus 2–160 karakter" }, { status: 400 });
    await db.update(families).set({ name, updatedAt: new Date() }).where(eq(families.id, context.membership.familyId));
    return NextResponse.json({ name });
  } catch (error) {
    return handleApiError(error);
  }
}
