import { type NextRequest, NextResponse } from "next/server";
import { readBearerUser } from "@/lib/auth/bearer";
import { isAdmin } from "@/lib/auth/permissions";
import { markRead, notificationsFor } from "@/lib/commissions/notifications";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * In-app rate-change notifications list & read marker for the native Android app.
 */
export async function GET(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user || !user.active) return json({ error: "signed_out" }, 401);
  try {
    const admin = isAdmin(user);
    const data = await notificationsFor(user.id, { everything: admin });
    return json(
      admin
        ? data
        : {
            ...data,
            items: data.items.map((item) => ({ ...item, recipients: { mode: "all" as const } })),
          },
    );
  } catch (error) {
    console.error("[app notifications] read failed:", error);
    return json({ items: [], unread: 0, lastRead: "" });
  }
}

export async function POST(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user || !user.active) return json({ error: "signed_out" }, 401);
  try {
    await markRead(user.id);
    return json({ ok: true });
  } catch (error) {
    console.error("[app notifications] mark read failed:", error);
    return json({ ok: false }, 502);
  }
}
