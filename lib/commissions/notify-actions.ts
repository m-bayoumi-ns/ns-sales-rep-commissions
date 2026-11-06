"use server";

import { readSessionUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { type CommissionNotification, markRead, notificationsFor } from "./notifications";

export type MyNotifications = { items: CommissionNotification[]; unread: number; lastRead: string };

/** The signed-in user's notifications (administrators see every notification sent). */
export async function getMyNotifications(): Promise<MyNotifications> {
  const user = await readSessionUser();
  if (!user) return { items: [], unread: 0, lastRead: "" };
  try {
    const data = await notificationsFor(user.id, { everything: isAdmin(user) });
    // Recipients lists are for administrators only.
    return isAdmin(user) ? data : { ...data, items: data.items.map((item) => ({ ...item, recipients: { mode: "all" as const } })) };
  } catch (error) {
    console.error("[notify] read failed:", error);
    return { items: [], unread: 0, lastRead: "" };
  }
}

export async function markNotificationsRead() {
  const user = await readSessionUser();
  if (!user) return;
  try {
    await markRead(user.id);
  } catch (error) {
    console.error("[notify] mark read failed:", error);
  }
}
