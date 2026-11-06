"use client";

import { ChevronDownIcon, LogOutIcon, Settings2Icon, UserCogIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AndroidAppMenuItem } from "@/components/layout/android-app";
import { signOut } from "@/lib/auth/actions";
import { useRouter } from "@/i18n/navigation";

export type HeaderUser = {
  name: string;
  email: string;
  /** e.g. "Retail executive · All branches" — role and branch scope. */
  scope: string;
  /** Super admin: sees the Settings page. */
  isAdmin?: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user }: { user: HeaderUser }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("userMenu")}
        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-start outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight md:flex">
          <bdi className="text-sm font-semibold">{user.name}</bdi>
          <span className="text-xs text-muted-foreground">{user.scope}</span>
        </span>
        <ChevronDownIcon aria-hidden className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <bdi className="font-semibold text-foreground">{user.name}</bdi>
            <bdi className="text-xs font-normal text-muted-foreground">{user.email}</bdi>
            <span className="text-xs font-normal text-muted-foreground">{user.scope}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <UserCogIcon aria-hidden />
          {t("account")}
        </DropdownMenuItem>
        {user.isAdmin ? (
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings2Icon aria-hidden />
            {t("settings")}
          </DropdownMenuItem>
        ) : null}
        {user.isAdmin ? (
          <DropdownMenuItem onClick={() => router.push("/accounts")}>
            <UsersIcon aria-hidden />
            {t("accounts")}
          </DropdownMenuItem>
        ) : null}
        <AndroidAppMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onClick={() => startSignOut(() => signOut(locale))}>
          <LogOutIcon aria-hidden className="rtl:-scale-x-100" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
