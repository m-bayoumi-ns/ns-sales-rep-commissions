import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/dal";
import { branchScope, isAdmin, isSeller } from "@/lib/auth/permissions";
import { UserMenu } from "./user-menu";

/** Reads the session, so it always renders inside <Suspense>. Sends only display fields to the browser. */
export async function HeaderUser() {
  const user = await requireUser();
  const t = await getTranslations("roles");
  const scope = branchScope(user);

  const role = user.jobTitle ?? t(user.permissionType);
  // A sales rep: "Sales representative · <rep name>".
  if (isSeller(user)) {
    return <UserMenu user={{ name: user.name, email: user.email, scope: `${t("seller")} · ${user.salesReps[0] ?? "—"}`, isAdmin: false }} />;
  }
  const where = scope.all
    ? t("allBranches")
    : scope.branches.length === 1
      ? scope.branches[0]
      : t("branchCount", { count: scope.branches.length });

  return <UserMenu user={{ name: user.name, email: user.email, scope: `${role} · ${where}`, isAdmin: isAdmin(user) }} />;
}

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-1.5" aria-hidden>
      <Skeleton className="size-8 rounded-full" />
      <div className="hidden flex-col gap-1.5 md:flex">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-36" />
      </div>
    </div>
  );
}
