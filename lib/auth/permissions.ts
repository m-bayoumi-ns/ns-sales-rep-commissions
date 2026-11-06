import type { AppUser, BranchScope } from "./types";

/**
 * Page slugs and other names that grant the page in `allowed_pages` (the same profiles table as
 * ns-home). "external:…" is the name an "External tools" tick in the main dashboard would write.
 */
export const PAGES = {
  "sales-commissions": {
    legacyNames: ["Sales Commissions", "Sales Rep Commissions", "عمولات المندوبين", "عمولات المبيعات", "external:sales-commissions", "external:ns-sales-rep-commissions"],
  },
} as const;

export type PageKey = keyof typeof PAGES;

/**
 * Commissions are sensitive, so — unlike the other NS sites — an empty `allowed_pages` list does NOT open
 * them: a user needs super_admin, or the page named explicitly in `allowed_pages`.
 */
export function canAccessPage(user: AppUser, page: PageKey): boolean {
  if (!user.active) return false;
  if (user.permissionType === "super_admin") return true;
  if (user.allowedPages.includes(`!external:${page}`)) return false;
  return user.allowedPages.includes(page) || PAGES[page].legacyNames.some((name) => user.allowedPages.includes(name));
}

/**
 * Branches the user may see. A specific-branches user with an empty branch list sees nothing.
 */
export function branchScope(user: AppUser): BranchScope {
  if (user.permissionType === "super_admin" || user.permissionType === "all_branches") {
    return { all: true };
  }
  return { all: false, branches: [...user.branches].sort() };
}

export function hasAnyBranch(user: AppUser): boolean {
  const scope = branchScope(user);
  return scope.all || scope.branches.length > 0;
}

/** A sales rep's own account: sees only their own commission and their account page. */
export function isSeller(user: AppUser): boolean {
  return user.permissionType !== "super_admin" && user.permissionType !== "all_branches" && user.branchFilterType === "sales_rep";
}

export function isAdmin(user: AppUser): boolean {
  return user.active && user.permissionType === "super_admin";
}
