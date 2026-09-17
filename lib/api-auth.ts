import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { familyMembers } from "@/db/schema";

export async function getRequestUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function requireFamily(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const [membership] = await db.select().from(familyMembers).where(eq(familyMembers.userId, user.id)).limit(1);
  if (!membership) return { response: NextResponse.json({ error: "Family not found" }, { status: 404 }) } as const;
  return { user, membership } as const;
}

export function handleApiError(error: unknown) {
  console.error("Little Moment API error", error);
  const message = process.env.NODE_ENV === "development" ? String(error) : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
