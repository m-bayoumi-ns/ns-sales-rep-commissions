"use client";

import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { changePassword, type PasswordState } from "@/lib/accounts/actions";

export function PasswordForm({ forced }: { forced: boolean }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, { status: "idle" });
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "saved") return;
    form.current?.reset();
    // After a forced change the rest of the site opens again.
    if (forced) {
      const timer = setTimeout(() => router.replace("/commissions"), 1200);
      return () => clearTimeout(timer);
    }
  }, [state, forced, router]);

  return (
    <form ref={form} action={action} aria-busy={pending} className="flex flex-col gap-4">
      {state.status === "saved" ? (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
          <CheckCircle2Icon aria-hidden className="size-4" />
          {t(forced ? "savedForced" : "saved")}
        </p>
      ) : state.status !== "idle" ? (
        <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {t(`errors.${state.status}`)}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="current">{t("current")}</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="next">{t("new")}</Label>
        <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">{t("confirm")}</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
        {t("save")}
      </Button>
    </form>
  );
}
