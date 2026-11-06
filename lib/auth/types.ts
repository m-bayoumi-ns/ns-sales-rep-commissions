/**
 * Permission model carried over from the Streamlit app (users.json):
 *   super_admin        → everything
 *   all_branches       → every branch (sales manager)
 *   specific_branches  → only `branches` (area / branch manager)
 */
export const PERMISSION_TYPES = ["super_admin", "all_branches", "specific_branches"] as const;
export type PermissionType = (typeof PERMISSION_TYPES)[number];

/** How a specific-branches user is linked to sales: by the branch, or by their sales reps. */
export type BranchFilterType = "branch" | "sales_rep";

/** The signed-in user as the server sees it. Never send this whole object to the browser. */
export type AppUser = {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  permissionType: PermissionType;
  branchFilterType: BranchFilterType;
  branches: string[];
  salesReps: string[];
  /** Legacy page names or slugs. Empty = every standard page (same as the old app). */
  allowedPages: string[];
  active: boolean;
  /** Set by an administrator: the user must choose a new password before anything else. */
  mustChangePassword: boolean;
};

/** Which branches a user may see. `all: true` means no branch restriction. */
export type BranchScope = { all: true } | { all: false; branches: string[] };
