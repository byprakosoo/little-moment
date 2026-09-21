import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { children as childrenTable, families, familyMembers } from "@/db/schema";
import { getRequestUser, handleApiError, requireFamily } from "@/lib/api-auth";
import { DEFAULT_FAMILY_NAME, DEFAULT_ROLE_LABELS } from "@/lib/app-config";

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
      await tx.insert(families).values({ id: familyId, name: body.familyName?.trim() || DEFAULT_FAMILY_NAME, ownerLabel: DEFAULT_ROLE_LABELS.owner, memberLabel: DEFAULT_ROLE_LABELS.member, createdAt: now, updatedAt: now });
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
    const body = await request.json() as { name?: string; ownerLabel?: string; memberLabel?: string; childNickname?: string; childBirthDate?: string };
    const [currentFamily] = await db.select().from(families).where(eq(families.id, context.membership.familyId)).limit(1);
    if (!currentFamily) return NextResponse.json({ error: "Family not found" }, { status: 404 });
    const name = body.name === undefined ? currentFamily.name : body.name.trim();
    const ownerLabel = body.ownerLabel === undefined ? currentFamily.ownerLabel : body.ownerLabel.trim();
    const memberLabel = body.memberLabel === undefined ? currentFamily.memberLabel : body.memberLabel.trim();
    const childNickname = body.childNickname === undefined ? undefined : body.childNickname.trim();
    const childBirthDate = body.childBirthDate === undefined ? undefined : body.childBirthDate.trim();
    if (name.length < 2 || name.length > 160) return NextResponse.json({ error: "Nama keluarga harus 2–160 karakter" }, { status: 400 });
    if (ownerLabel.length < 1 || ownerLabel.length > 40 || memberLabel.length < 1 || memberLabel.length > 40) return NextResponse.json({ error: "Label orang tua harus 1–40 karakter" }, { status: 400 });
    if (childNickname !== undefined && (childNickname.length < 1 || childNickname.length > 40)) return NextResponse.json({ error: "Nama panggilan bayi harus 1–40 karakter" }, { status: 400 });
    if (childBirthDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(childBirthDate)) return NextResponse.json({ error: "Tanggal lahir bayi tidak valid" }, { status: 400 });
      const [year, month, day] = childBirthDate.split("-").map(Number);
      const parsedDate = new Date(Date.UTC(year, month - 1, day));
      const today = new Date();
      const todayValue = today.toISOString().slice(0, 10);
      const isCalendarDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day;
      if (Number.isNaN(parsedDate.getTime()) || !isCalendarDate) return NextResponse.json({ error: "Tanggal lahir bayi tidak valid" }, { status: 400 });
      if (childBirthDate > todayValue) return NextResponse.json({ error: "Tanggal lahir bayi tidak boleh di masa depan" }, { status: 400 });
    }
    const [currentChild] = await db.select().from(childrenTable).where(eq(childrenTable.familyId, context.membership.familyId)).limit(1);
    const nextChild = currentChild && (childNickname !== undefined || childBirthDate !== undefined)
      ? { id: currentChild.id, nickname: childNickname ?? currentChild.nickname, birthDate: childBirthDate ?? currentChild.birthDate }
      : currentChild
        ? { id: currentChild.id, nickname: currentChild.nickname, birthDate: currentChild.birthDate }
        : null;
    await db.transaction(async (tx) => {
      await tx.update(families).set({ name, ownerLabel, memberLabel, updatedAt: new Date() }).where(eq(families.id, context.membership.familyId));
      if (currentChild && nextChild && (childNickname !== undefined || childBirthDate !== undefined)) {
        await tx.update(childrenTable).set({ nickname: nextChild.nickname, birthDate: nextChild.birthDate, updatedAt: new Date() }).where(eq(childrenTable.id, currentChild.id));
      }
    });
    return NextResponse.json({ name, ownerLabel, memberLabel, child: nextChild });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireFamily(request);
    if ("response" in context) return context.response;
    if (context.membership.role === "owner") {
      return NextResponse.json({ error: "Pemilik jurnal tidak bisa keluar. Transfer kepemilikan atau hapus jurnal terlebih dahulu." }, { status: 409 });
    }
    await db.delete(familyMembers).where(eq(familyMembers.id, context.membership.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
