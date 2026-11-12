export function filterVisibleMonths(months: string[], from: string, to?: string): string[] {
  if (to && from > to) return [];
  return months.filter((month) => month >= from && (!to || month <= to));
}
