/**
 * Matching sales-rep names between the target sheet, Odoo users and user profiles.
 * Odoo names carry an employee code ("NSR370_محمود احمد", "NSR3650-محمد …") or a phone number
 * ("محمد سيد - 1009913619"); the sheet usually has the plain name.
 */
export function cleanRepName(name: string): string {
  return name
    .replace(/^[A-Z]{2,5}\d+\s*[_\-–]\s*/i, "")
    .replace(/\s*[-–]\s*\d{6,}\s*$/, "")
    .trim();
}

export function normalizeName(name: string): string {
  return cleanRepName(name)
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/(^|\s)(عبد|ابو|أبو)\s+/g, "$1$2")
    .trim();
}

const tokens = (name: string) => normalizeName(name).split(" ").filter(Boolean);

/**
 * Best Odoo user for a sheet name: the same normalized name, else the user whose name starts with the
 * sheet's words (sheet "أحمد عادل" → "NSR305_أحمد عادل شحاته"), else the most shared words (at least 2).
 */
export function matchRep<T extends { id: number; name: string }>(name: string, users: T[]): T | null {
  const wanted = normalizeName(name);
  if (!wanted) return null;
  const exact = users.find((user) => normalizeName(user.name) === wanted);
  if (exact) return exact;
  const prefix = users.filter((user) => normalizeName(user.name).startsWith(`${wanted} `) || wanted.startsWith(`${normalizeName(user.name)} `));
  if (prefix.length === 1) return prefix[0];
  const mine = tokens(name);
  let best: T | null = null;
  let bestScore = 0;
  let tie = false;
  for (const user of users) {
    const theirs = new Set(tokens(user.name));
    // Words in order from the first name: the first name must match.
    if (!theirs.size || !mine.length || !theirs.has(mine[0])) continue;
    const score = mine.filter((word) => theirs.has(word)).length;
    if (score > bestScore) {
      best = user;
      bestScore = score;
      tie = false;
    } else if (score === bestScore) tie = true;
  }
  return bestScore >= Math.min(2, mine.length) && !tie ? best : null;
}

/**
 * Registration: the target-sheet name that matches what the person typed, or null.
 * The typed name must be the same name (codes like "NSR305_" and spelling variants of أ/ا, ة/ه, ى/ي are ignored),
 * so a near match does not open someone else's commission.
 */
export function findSheetName(typed: string, names: string[]): string | null {
  const wanted = normalizeName(typed);
  if (!wanted) return null;
  return names.find((name) => normalizeName(name) === wanted) ?? null;
}
