/**
 * Seller usernames. Sales reps created from the target sheet have no email, so each gets a username
 * (the employee code from the sheet name, e.g. "nsr305", else "rep<Odoo user id>") and a sign-in email
 * built from it on a private domain. The sign-in page accepts either the email or the username.
 */
export const SELLER_EMAIL_DOMAIN = "reps.naguibselim.local";

/** What the person typed on the sign-in page → the email Supabase knows. */
export function loginEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${SELLER_EMAIL_DOMAIN}`;
}

/** The username behind a generated email, or null for a real email. */
export function usernameOf(email: string): string | null {
  const value = email.trim().toLowerCase();
  return value.endsWith(`@${SELLER_EMAIL_DOMAIN}`) ? value.slice(0, -(SELLER_EMAIL_DOMAIN.length + 1)) : null;
}

/** A unique username for a sheet name: its employee code, else rep<Odoo id>, else rep<n>. */
export function usernameFor(name: string, odooUserId: number | null, taken: Set<string>): string {
  const code = name.match(/^\s*([A-Za-z]{2,5}\d+)/)?.[1]?.toLowerCase();
  let base = code ?? (odooUserId ? `rep${odooUserId}` : "rep");
  if (!code && !odooUserId) base = "rep1";
  let candidate = base;
  for (let n = 2; taken.has(candidate); n++) candidate = `${base}-${n}`;
  taken.add(candidate);
  return candidate;
}
