import { type NextRequest, NextResponse } from "next/server";
import { isValidCronKey, pushFeedForAll } from "@/lib/app/push";

/** Commission checks for subscribed browsers / iPhone web apps can take a while (one Odoo read per user). */
export const maxDuration = 60;

/**
 * Scheduled push run (GitHub Actions, .github/workflows/push-tick.yml): checks every subscribed browser for
 * commission and bonus changes and pushes them. Protected by the PUSH_CRON_KEY header (see lib/app/push.ts).
 */
export async function POST(request: NextRequest) {
  if (!isValidCronKey(request.headers.get("x-cron-key"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await pushFeedForAll();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
