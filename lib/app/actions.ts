"use server";

import { readSessionUser } from "@/lib/auth/dal";
import { requestTest } from "./devices";

export type TestState = { status: "idle" | "sent" | "error" };

/** My account → "Send a test notification to my phone". */
export async function sendTestNotification(): Promise<TestState> {
  const user = await readSessionUser();
  if (!user) return { status: "error" };
  try {
    await requestTest(user.id);
    return { status: "sent" };
  } catch (error) {
    console.error("[app] test notification failed:", error);
    return { status: "error" };
  }
}
