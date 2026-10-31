import { normalizePlan, type BillingPlan } from "@/lib/billing/pricing";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_PLANS = new Set<BillingPlan>(["basic", "premium", "custom", "trial_basic", "trial_premium"]);

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function requireUuid(value: unknown, fieldName = "id") {
  if (!isUuid(value)) {
    throw Object.assign(new Error(`Invalid ${fieldName}.`), { status: 400 });
  }
  return value;
}

export function normalizeKenyanPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

export function requireKenyanPhoneNumber(value: unknown) {
  const normalizedPhone = normalizeKenyanPhoneNumber(String(value || ""));
  if (!/^254[71]\d{8}$/.test(normalizedPhone)) {
    throw Object.assign(new Error("Enter a valid Kenyan M-Pesa phone number."), { status: 400 });
  }
  return normalizedPhone;
}

export function requireBillingPlan(value: unknown) {
  const normalized = normalizePlan(String(value || ""));
  if (!ALLOWED_PLANS.has(normalized)) {
    throw Object.assign(new Error("Invalid plan tier."), { status: 400 });
  }
  return normalized;
}

export function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function requireText(value: unknown, fieldName: string, maxLength = 120) {
  const text = String(value || "").trim();
  if (!text) {
    throw Object.assign(new Error(`${fieldName} is required.`), { status: 400 });
  }
  if (text.length > maxLength) {
    throw Object.assign(new Error(`${fieldName} is too long.`), { status: 400 });
  }
  return text;
}

export function optionalText(value: unknown, maxLength = 240) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}
