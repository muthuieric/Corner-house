/**
 * Normalise a raw visitor/transaction status into a canonical key used by
 * StatusBadge and the dashboard. Permissive by design (in-progress scaffold).
 */
export function normalizeVisitorStatus(status: unknown): string {
  return String(status || "").trim().toLowerCase().replace(/[_\s-]+/g, "_") || "neutral";
}
