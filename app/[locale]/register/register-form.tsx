"use client";

import { AlertCircleIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon, UserXIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { type RegisterState, register } from "@/lib/accounts/actions";

/** Seller self-registration: only names listed in the latest target sheet are accepted. */
export function RegisterForm() {
  const t = useTranslations("register");
  const locale = useLocale();
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, { status: "idle" });
  const [show, setShow] = useState(false);

  if (state.status === "pending") {
    return (
      <div className="flex flex-col gap-4">
        <Alert role="status" className="border-success/30 bg-success-soft">
          <CheckCircle2Icon aria-hidden />
          <AlertTitle>{t("pendingTitle")}</AlertTitle>
          <AlertDescription>{t("pendingBody")}</AlertDescription>
        </Alert>
        <Link href="/login" className="text-center text-sm font-semibold text-primary hover:underline">
          {t("toLogin")}
        </Link>
      </div>
    );
  }

  const banner =
    state.status === "unknown"
      ? { icon: <UserXIcon aria-hidden />, title: t("unknownTitle"), body: t("unknownBody") }
      : state.status !== "idle"
        ? { icon: <AlertCircleIcon aria-hidden />, title: t(`errors.${state.status}`), body: null }
        : null;

  return (
    <form action={action} aria-busy={pending} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {banner ? (
        <Alert variant="destructive" role="alert" className="border-destructive/30 bg-destructive-soft">
          {banner.icon}
          <AlertTitle>{banner.title}</AlertTitle>
          {banner.body ? <AlertDescription>{banner.body}</AlertDescription> : null}
        </Alert>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required minLength={3} autoComplete="name" defaultValue={state.values?.name} key={`n-${state.values?.name ?? ""}`} className="h-11" />
        <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" dir="ltr" required autoComplete="email" defaultValue={state.values?.email} key={`e-${state.values?.email ?? ""}`} className="h-11 rtl:text-end" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <Input id="password" name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" className="h-11 pe-11" />
          <Button type="button" variant="ghost" size="icon" aria-label={t("show")} aria-pressed={show} onClick={() => setShow((value) => !value)} className="absolute end-1 top-1">
            {show ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">{t("confirm")}</Label>
        <Input id="confirm" name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" className="h-11" />
      </div>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("toLogin")}
        </Link>
      </p>
    </form>
  );
}
