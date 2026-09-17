import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { children as childrenTable, families, familyMembers } from "@/db/schema";
import { getRequestUser, handleApiError } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json() as { familyName?: string; nickname?: string; birthDate?: string };
    if (!body.nickname || !body.birthDate) return NextResponse.json({ error: "nickname and birthDate are required" }, { status: 400 });
    const nickname = body.nickname;
    const birthDate = body.birthDate;
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
