import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { entries, photos } from "@/db/schema";
import { db } from "@/lib/db";
import { handleApiError, requireFamily } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireFamily(request);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    const [photo] = await db.select({ dataUrl: photos.dataUrl, mimeType: photos.mimeType })
      .from(photos)
      .innerJoin(entries, eq(entries.id, photos.entryId))
      .where(and(eq(photos.id, id), eq(entries.familyId, auth.membership.familyId)))
      .limit(1);
    if (!photo?.dataUrl) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    const separator = photo.dataUrl.indexOf(",");
    const encoded = separator >= 0 ? photo.dataUrl.slice(separator + 1) : photo.dataUrl;
    const bytes = Buffer.from(encoded, "base64");
    return new NextResponse(bytes, { headers: { "Content-Type": photo.mimeType || "image/jpeg", "Cache-Control": "private, max-age=3600", "Content-Length": String(bytes.byteLength) } });
  } catch (error) {
    return handleApiError(error);
  }
}
