import { NextResponse } from "next/server";
import { eq, sum } from "drizzle-orm";
import { entries as entriesTable, photos } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";
const DEFAULT_QUOTA_BYTES = 8 * 1024 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const [row] = await db.select({ usedBytes: sum(photos.byteSize) }).from(photos).innerJoin(entriesTable, eq(entriesTable.id, photos.entryId)).where(eq(entriesTable.familyId, auth.membership.familyId));
    const usedBytes = Number(row?.usedBytes || 0);
    return NextResponse.json({ usedBytes, quotaBytes: DEFAULT_QUOTA_BYTES, percent: Math.round((usedBytes / DEFAULT_QUOTA_BYTES) * 1000) / 10 });
  } catch (error) {
    return handleApiError(error);
  }
}
