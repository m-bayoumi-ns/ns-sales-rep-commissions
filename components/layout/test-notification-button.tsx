"use client";

import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { sendTestNotification, type TestState } from "@/lib/app/actions";

/** Asks every phone of this account to show a test notification. */
export function TestNotificationButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("phoneNotify");
  const [state, action, pending] = useActionState<TestState>(sendTestNotification, { status: "idle" });
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <BellIcon aria-hidden className="size-4" />
        {pending ? t("sending") : t("sendTest")}
      </button>
      {state.status === "sent" ? <p className="text-xs text-success">{t("sent")}</p> : null}
      {state.status === "error" ? <p className="text-xs text-destructive">{t("error")}</p> : null}
    </form>
  );
}
