export function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name?: string | null) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "KV";
}

export function maskPhoneNumber(phoneNumber?: string | null) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  if (digits.length < 7) return "";
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

export function getAccountStatusLabel(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "trial") return "Trial";
  if (normalized === "locked") return "Locked";
  if (normalized === "active") return "Active";
  if (normalized === "pending_payment") return "Pending payment";
  if (normalized === "settled") return "Settled";
  return "Unknown";
}

export function getStatusBadgeVariant(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  if (["active", "paid", "completed", "success", "settled"].includes(normalized)) return "success";
  if (["pending", "pending_payment", "trial"].includes(normalized)) return "warning";
  if (["locked", "failed", "cancelled", "canceled", "reversed", "unpaid"].includes(normalized)) return "danger";
  return "neutral";
}
