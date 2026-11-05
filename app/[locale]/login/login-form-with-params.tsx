"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";

/** Reads ?next= and ?reason= (session expired) from the URL; rendered inside Suspense. */
export function LoginFormWithParams() {
  const params = useSearchParams();
  return <LoginForm next={params.get("next") ?? undefined} reason={params.get("reason") ?? undefined} />;
}
