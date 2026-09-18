import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { families, invites } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";
import { sendFamilyInviteEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const body = await request.json() as { email?: string };
    const email = body.email?.toLowerCase().trim() || "";
    if (!email.includes("@")) return NextResponse.json({ error: "Masukkan email yang valid" }, { status: 400 });
    const [family] = await db.select({ name: families.name }).from(families).where(eq(families.id, auth.membership.familyId)).limit(1);
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const inviteId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    await db.insert(invites).values({ id: inviteId, familyId: auth.membership.familyId, email, tokenHash, status: "pending", expiresAt, createdAt: new Date() });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    if (!appUrl) return NextResponse.json({ error: "URL aplikasi belum dikonfigurasi" }, { status: 500 });
    const inviteUrl = new URL("/invite", appUrl);
    inviteUrl.searchParams.set("token", rawToken);
    try {
      await sendFamilyInviteEmail({ to: email, familyName: family.name, inviterName: auth.user.name || "Orang tua", inviteUrl: inviteUrl.toString() });
    } catch (error) {
      await db.update(invites).set({ status: "delivery_failed" }).where(eq(invites.id, inviteId));
      return NextResponse.json({ error: error instanceof Error ? error.message : "Undangan belum bisa dikirim" }, { status: 502 });
    }
    return NextResponse.json({ status: "pending" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const rows = await db.select().from(invites).where(and(eq(invites.familyId, auth.membership.familyId), eq(invites.status, "pending"))).orderBy(desc(invites.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
