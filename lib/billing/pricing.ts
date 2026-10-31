export type BillingPlan =
  | "basic"
  | "premium"
  | "custom"
  | "trial_basic"
  | "trial_premium";

export type BaseBillingPlan = "basic" | "premium" | "custom";

export type PricingSnapshot = {
  planName: BillingPlan;
  basePrice: number;
  includedVisitors: number;
  extraVisitorRate: number;
};

export type BillingCalculation = PricingSnapshot & {
  visitorCount: number;
  extraVisitors: number;
  extraVisitorCharges: number;
  totalAmount: number;
};

export type BillingCalculationOptions = {
  isTrialActive?: boolean;
};

export const BASIC_BASE_PRICE = 0;
export const BASIC_INCLUDED_VISITORS = 500;
export const BASIC_EXTRA_VISITOR_RATE = 2;

export const PREMIUM_BASE_PRICE = 500;
export const PREMIUM_INCLUDED_VISITORS = 1000;
export const PREMIUM_EXTRA_VISITOR_RATE = 3;

export const BILLING_PLANS: Record<BillingPlan, PricingSnapshot> = {
  basic: {
    planName: "basic",
    basePrice: BASIC_BASE_PRICE,
    includedVisitors: BASIC_INCLUDED_VISITORS,
    extraVisitorRate: BASIC_EXTRA_VISITOR_RATE,
  },
  premium: {
    planName: "premium",
    basePrice: PREMIUM_BASE_PRICE,
    includedVisitors: PREMIUM_INCLUDED_VISITORS,
    extraVisitorRate: PREMIUM_EXTRA_VISITOR_RATE,
  },
  custom: {
    planName: "custom",
    basePrice: 0,
    includedVisitors: 0,
    extraVisitorRate: 0,
  },
  trial_basic: {
    planName: "trial_basic",
    basePrice: 0,
    includedVisitors: BASIC_INCLUDED_VISITORS,
    extraVisitorRate: BASIC_EXTRA_VISITOR_RATE,
  },
  trial_premium: {
    planName: "trial_premium",
    basePrice: 0,
    includedVisitors: PREMIUM_INCLUDED_VISITORS,
    extraVisitorRate: PREMIUM_EXTRA_VISITOR_RATE,
  },
};

export const PLANS = BILLING_PLANS;

export function formatPrice(amount: number) {
  if (amount === 0) return "Free";
  return `KES ${amount.toLocaleString()}`;
}

export function calculateStatement(
  plan: string | null | undefined,
  visitorCount: number,
  amountPaid = 0,
  options: BillingCalculationOptions = {}
) {
  const charge = calculateMonthlyCharge(plan, visitorCount, options);
  const safePaid = Math.max(0, Number(amountPaid) || 0);
  const currentBalance = Math.max(0, charge.totalAmount - safePaid);
  return {
    ...charge,
    amountPaid: safePaid,
    currentBalance,
  };
}

function normalizePlanText(plan?: string | null) {
  return String(plan || "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ");
}

export function parseBillingPlan(plan?: string | null): BillingPlan | null {
  const normalized = normalizePlanText(plan);
  if (normalized === "premium") return "premium";
  if (normalized === "custom") return "custom";
  if (normalized === "basic") return "basic";
  if (normalized === "trial basic" || normalized === "basic trial") return "trial_basic";
  if (normalized === "trial premium" || normalized === "premium trial") return "trial_premium";
  if (normalized.includes("trial") && normalized.includes("premium")) return "trial_premium";
  if (normalized.includes("trial") && normalized.includes("basic")) return "trial_basic";
  if (normalized.includes("premium")) return "premium";
  if (normalized.includes("custom")) return "custom";
  if (normalized.includes("basic")) return "basic";
  return null;
}

export function normalizePlan(plan?: string | null): BillingPlan {
  const parsed = parseBillingPlan(plan);
  if (parsed) return parsed;
  return "basic";
}

export function isTrialPlan(plan?: string | null) {
  const normalized = normalizePlan(plan);
  return normalized === "trial_basic" || normalized === "trial_premium";
}

export function getBasePlan(plan?: string | null): BaseBillingPlan {
  const normalized = normalizePlan(plan);
  if (normalized === "trial_basic") return "basic";
  if (normalized === "trial_premium") return "premium";
  return normalized;
}

export function getPricingSnapshot(plan?: string | null): PricingSnapshot {
  return BILLING_PLANS[normalizePlan(plan)];
}

export function calculateMonthlyCharge(
  plan: string | null | undefined,
  visitorCount: number,
  options: BillingCalculationOptions = {}
): BillingCalculation {
  const normalizedPlan = normalizePlan(plan);
  const basePlan = getBasePlan(normalizedPlan);
  const baseSnapshot = BILLING_PLANS[basePlan];
  const trialActive = isTrialPlan(normalizedPlan) && options.isTrialActive === true;
  const safeVisitorCount = Math.max(0, Math.floor(Number(visitorCount) || 0));
  const extraVisitors = Math.max(0, safeVisitorCount - baseSnapshot.includedVisitors);
  const extraVisitorCharges = trialActive ? 0 : extraVisitors * baseSnapshot.extraVisitorRate;

  return {
    planName: normalizedPlan,
    basePrice: trialActive ? 0 : baseSnapshot.basePrice,
    includedVisitors: baseSnapshot.includedVisitors,
    extraVisitorRate: baseSnapshot.extraVisitorRate,
    visitorCount: safeVisitorCount,
    extraVisitors,
    extraVisitorCharges,
    totalAmount: trialActive ? 0 : baseSnapshot.basePrice + extraVisitorCharges,
  };
}

export function addOneMonth(date: Date) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + 1);

  if (next.getDate() !== day) {
    next.setDate(0);
  }

  return next;
}

export function getBillingPeriodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getBillingPeriod(date = new Date()) {
  const periodStart = new Date(date);
  const periodEnd = addOneMonth(periodStart);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    periodKey: getBillingPeriodKey(periodStart),
  };
}

export function getPlanLabel(plan?: string | null) {
  const normalized = normalizePlan(plan);
  if (normalized === "premium") return "Premium";
  if (normalized === "custom") return "Custom";
  if (normalized === "trial_basic") return "Trial (Basic)";
  if (normalized === "trial_premium") return "Trial (Premium)";
  return "Basic";
}
