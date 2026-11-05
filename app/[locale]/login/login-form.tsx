"use client";

import { AlertCircleIcon, EyeIcon, EyeOffIcon, InfoIcon, Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignInState, signIn } from "@/lib/auth/actions";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type FieldErrors = { email?: boolean; password?: boolean };

export function LoginForm({ next, reason }: { next?: string; reason?: string }) {
  const t = useTranslations("login");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { status: "idle" });
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [forgotOpen, setForgotOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const errors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  // Server-side field errors also move focus to the first invalid field.
  useEffect(() => {
    if (state.fieldErrors?.email) emailRef.current?.focus();
    else if (state.fieldErrors?.password) passwordRef.current?.focus();
    else if (state.status === "invalid") passwordRef.current?.focus();
  }, [state]);

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ email: data.get("email"), password: data.get("password") });
    if (parsed.success) {
      setClientErrors({});
      return;
    }
    event.preventDefault();
    const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]));
    const next = { email: fields.has("email"), password: fields.has("password") };
    setClientErrors(next);
    (next.email ? emailRef : passwordRef).current?.focus();
  }

  const banner = (() => {
    switch (state.status) {
      case "invalid":
        return { tone: "error", title: t("errors.invalidCredentials"), body: t("errors.invalidCredentialsHint") };
      case "locked":
        return { tone: "error", title: t("errors.locked"), body: t("errors.lockedHint") };
      case "error":
        return { tone: "error", title: t("errors.generic"), body: null };
      case "not_configured":
        return { tone: "info", title: t("errors.notConfigured"), body: null };
      default:
        if (reason === "expired") return { tone: "info", title: t("sessionExpired"), body: t("sessionExpiredHint") };
        return null;
    }
  })();

  return (
    <form noValidate action={formAction} onSubmit={validate} aria-busy={pending} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />

      {banner ? (
        <Alert
          variant={banner.tone === "error" ? "destructive" : "default"}
          role={banner.tone === "error" ? "alert" : "status"}
          className={banner.tone === "error" ? "border-destructive/30 bg-destructive-soft" : "bg-muted"}
        >
          {banner.tone === "error" ? <AlertCircleIcon aria-hidden /> : <InfoIcon aria-hidden />}
          <AlertTitle>{banner.title}</AlertTitle>
          {banner.body ? <AlertDescription>{banner.body}</AlertDescription> : null}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="username"
          inputMode="email"
          defaultValue={state.email}
          key={state.email ?? "email"}
          placeholder={t("emailPlaceholder")}
          aria-invalid={errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-11 rtl:text-end"
        />
        {errors.email ? (
          <p id="email-error" className="text-sm text-destructive">
            {t("errors.emailInvalid")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <button
            type="button"
            aria-expanded={forgotOpen}
            aria-controls="forgot-help"
            onClick={() => setForgotOpen((open) => !open)}
            className="rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("forgotPassword")}
          </button>
        </div>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            aria-invalid={errors.password || undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-11 pe-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("showPassword")}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute end-1 top-1"
          >
            {showPassword ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
          </Button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {t("errors.passwordRequired")}
          </p>
        ) : null}
        {forgotOpen ? (
          <p id="forgot-help" role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("forgotPasswordHelp")}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2Icon aria-hidden className="animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
