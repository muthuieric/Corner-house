import { createNeonAdmin } from "@/lib/pg-client";
import { createClient } from "@supabase/supabase-js";
import {
  addOneMonth,
  calculateMonthlyCharge,
  getBasePlan,
  getBillingPeriod,
  getBillingPeriodKey,
  getPlanLabel,
  isTrialPlan,
  normalizePlan,
} from "@/lib/billing/pricing";
import type { BillingPlan } from "@/lib/billing/pricing";

export function createSupabaseAdmin() {
  if (process.env.DATABASE_URL) {
    return createNeonAdmin() as any;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
  );
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42703" ||
    candidate.code === "PGRST204" ||
    /column .* does not exist|Could not find .* column/i.test(candidate.message || "")
  );
}

function isPaidStatus(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "paid" || normalized === "completed" || normalized === "success";
}

type CompanyBillingFields = {
  id?: string;
  created_at?: string | null;
  plan_tier?: string | null;
  pending_plan_tier?: string | null;
  pending_plan_effective_at?: string | null;
  plan_change_effective_at?: string | null;
  subscription_status?: string | null;
  subscription_ends_at?: string | null;
  subscription_expires_at?: string | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  current_balance?: number | null;
  amount_paid?: number | null;
  is_locked?: boolean | null;
  hard_locked?: boolean | null;
};

function getPendingPlanEffectiveAt(company: CompanyBillingFields) {
  return company.pending_plan_effective_at || company.plan_change_effective_at || null;
}

async function applyPendingPlanIfDue(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  companyId: string,
  company: CompanyBillingFields
): Promise<BillingPlan> {
  const currentPlan = normalizePlan(company.plan_tier);
  const pendingPlan = company.pending_plan_tier ? normalizePlan(company.pending_plan_tier) : null;
  const effectiveAt = getPendingPlanEffectiveAt(company);
  const effectiveDate = effectiveAt ? new Date(effectiveAt) : null;

  if (!pendingPlan || !effectiveDate || Number.isNaN(effectiveDate.getTime()) || effectiveDate > new Date()) {
    return currentPlan;
  }

  const { error } = await supabaseAdmin
    .from("companies")
    .update({
      plan_tier: pendingPlan,
      pending_plan_tier: null,
      pending_plan_effective_at: null,
    })
    .eq("id", companyId);

  if (error) throw error;

  company.plan_tier = pendingPlan;
  company.pending_plan_tier = null;
  company.pending_plan_effective_at = null;
  company.plan_change_effective_at = null;

  return pendingPlan;
}

function getStoredBillingPeriod(company: CompanyBillingFields) {
  const startValue = company.billing_period_start || company.created_at || new Date().toISOString();
  const periodStartDate = new Date(startValue);
  const safeStart = Number.isNaN(periodStartDate.getTime()) ? new Date() : periodStartDate;
  const endValue = company.billing_period_end;
  const periodEndDate = endValue ? new Date(endValue) : addOneMonth(safeStart);
  const safeEnd = Number.isNaN(periodEndDate.getTime()) ? addOneMonth(safeStart) : periodEndDate;

  return {
    periodStart: safeStart.toISOString(),
    periodEnd: safeEnd.toISOString(),
    periodKey: getBillingPeriodKey(safeStart),
  };
}

function getUtcBillingMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${safeDate.getUTCFullYear()}-${String(safeDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

async function updateCompanyWithOptionalHardLock(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  companyId: string,
  payload: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from("companies").update(payload).eq("id", companyId);
  if (!isMissingColumnError(error)) {
    if (error) throw error;
    return;
  }

  // Older deployments that may not have hard_locked column yet
  const withoutHardLock = { ...payload };
  delete withoutHardLock.hard_locked;
  const retry = await supabaseAdmin.from("companies").update(withoutHardLock).eq("id", companyId);
  if (retry.error) throw retry.error;
}

export async function markCompanyPaymentSuccessful(companyId: string, paidAt: string, amount: number) {
  const supabaseAdmin = createSupabaseAdmin();
  const paidDate = new Date(paidAt);
  const safePaidAt = Number.isNaN(paidDate.getTime()) ? new Date().toISOString() : paidDate.toISOString();
  const period = getBillingPeriod(new Date(safePaidAt));

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("amount_paid")
    .eq("id", companyId)
    .single();

  await updateCompanyWithOptionalHardLock(supabaseAdmin, companyId, {
    billing_period_start: period.periodStart,
    billing_period_end: period.periodEnd,
    subscription_status: "active",
    current_balance: 0,
    amount_paid: Number(company?.amount_paid || 0) + Number(amount || 0),
    is_locked: false,
    hard_locked: false,
  });

  return period;
}

export async function getCurrentBillingSummary(companyId: string) {
  const supabaseAdmin = createSupabaseAdmin();

  let companyResult = await supabaseAdmin
    .from("companies")
    .select(
      "id, name, created_at, plan_tier, pending_plan_tier, pending_plan_effective_at, subscription_status, subscription_ends_at, subscription_expires_at, billing_period_start, billing_period_end, current_balance, amount_paid, is_locked, hard_locked"
    )
    .eq("id", companyId)
    .single();

  if (isMissingColumnError(companyResult.error)) {
    companyResult = await supabaseAdmin
      .from("companies")
      .select(
        "id, name, created_at, plan_tier, pending_plan_tier, plan_change_effective_at, subscription_status, subscription_ends_at, billing_period_start, billing_period_end, current_balance, amount_paid, is_locked"
      )
      .eq("id", companyId)
      .single();
  }

  if (isMissingColumnError(companyResult.error)) {
    companyResult = await supabaseAdmin
      .from("companies")
      .select("id, name, created_at, is_locked")
      .eq("id", companyId)
      .single();
  }

  const { data: company, error: companyError } = companyResult;

  if (companyError || !company) {
    throw new Error(companyError?.message || "Company not found.");
  }

  const companyWithBilling = company as typeof company & {
    plan_tier?: string | null;
    pending_plan_tier?: string | null;
    pending_plan_effective_at?: string | null;
    plan_change_effective_at?: string | null;
    subscription_status?: string | null;
    subscription_ends_at?: string | null;
    subscription_expires_at?: string | null;
    billing_period_start?: string | null;
    billing_period_end?: string | null;
    current_balance?: number | null;
    amount_paid?: number | null;
    is_locked?: boolean | null;
    hard_locked?: boolean | null;
  };
  let activePlan = await applyPendingPlanIfDue(supabaseAdmin, companyId, companyWithBilling);
  let subscriptionStatus = companyWithBilling.subscription_status || "active";
  let { periodStart, periodEnd, periodKey } = getStoredBillingPeriod(companyWithBilling);

  const now = new Date();
  const trialEndValue =
    companyWithBilling.subscription_ends_at || companyWithBilling.subscription_expires_at || null;
  const trialEnd = trialEndValue ? new Date(trialEndValue) : null;
  const isActiveTrial =
    isTrialPlan(activePlan) && !!trialEnd && !Number.isNaN(trialEnd.getTime()) && now < trialEnd;
  let convertedExpiredTrial = false;

  if (isActiveTrial) {
    periodStart = companyWithBilling.billing_period_start || companyWithBilling.created_at || periodStart;
    periodEnd = trialEnd!.toISOString();
    periodKey = getBillingPeriod(new Date(periodStart)).periodKey;
  } else if (isTrialPlan(activePlan)) {
    const basePlan = getBasePlan(activePlan);
    const trialEndedAt = trialEnd && !Number.isNaN(trialEnd.getTime()) ? trialEnd : now;
    const expiredPeriod = getBillingPeriod(trialEndedAt);
    periodStart = expiredPeriod.periodStart;
    periodEnd = expiredPeriod.periodEnd;
    periodKey = expiredPeriod.periodKey;
    subscriptionStatus = "unpaid";

    await updateCompanyWithOptionalHardLock(supabaseAdmin, companyId, {
      plan_tier: basePlan,
      subscription_status: "unpaid",
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
    });

    activePlan = basePlan;
    convertedExpiredTrial = true;
  } else if (!companyWithBilling.billing_period_start || !companyWithBilling.billing_period_end) {
    await updateCompanyWithOptionalHardLock(supabaseAdmin, companyId, {
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
    });
  }

  let visitorCount = 0;
  const usageResult = await supabaseAdmin
    .from("billing_usage")
    .select("visitor_count")
    .eq("company_id", companyId)
    .eq("billing_month", getUtcBillingMonthKey(periodStart))
    .maybeSingle();

  if (!usageResult.error && usageResult.data) {
    visitorCount = Number(usageResult.data.visitor_count || 0);
  } else {
    const { count, error: visitorsError } = await supabaseAdmin
      .from("visitors")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd);

    if (visitorsError) {
      throw new Error("Failed to calculate monthly visitor usage.");
    }

    visitorCount = count || 0;
  }

  const calculation = calculateMonthlyCharge(activePlan, visitorCount, { isTrialActive: isActiveTrial });

  let transactionsResult = await supabaseAdmin
    .from("transactions")
    .select("amount, status")
    .eq("company_id", companyId)
    .eq("billing_period_key", periodKey);

  if (isMissingColumnError(transactionsResult.error)) {
    transactionsResult = await supabaseAdmin
      .from("transactions")
      .select("amount, status")
      .eq("company_id", companyId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd);
  }

  if (transactionsResult.error) {
    throw new Error(transactionsResult.error.message);
  }

  const paidAmount = (transactionsResult.data || []).reduce(
    (sum: number, transaction: { amount?: number | string | null; status?: string | null }) => {
      return isPaidStatus(transaction.status) ? sum + Number(transaction.amount || 0) : sum;
    },
    0
  );

  const currentBalance = isActiveTrial ? 0 : Math.max(0, calculation.totalAmount - paidAmount);
  if (convertedExpiredTrial) {
    const expiredStatus = currentBalance > 0 ? "unpaid" : "active";
    await updateCompanyWithOptionalHardLock(supabaseAdmin, companyId, {
      current_balance: currentBalance,
      subscription_status: expiredStatus,
    });
    subscriptionStatus = expiredStatus;
  }
  const accountStatus =
    companyWithBilling.hard_locked || companyWithBilling.is_locked
      ? "locked"
      : isActiveTrial
      ? "trial"
      : subscriptionStatus === "active" || subscriptionStatus === "paid"
      ? currentBalance > 0
        ? "pending_payment"
        : "active"
      : currentBalance > 0
      ? "pending_payment"
      : "settled";

  return {
    ...calculation,
    company: {
      id: company.id,
      name: company.name,
      created_at: company.created_at,
      is_locked: companyWithBilling.is_locked,
      hard_locked: companyWithBilling.hard_locked,
    },
    periodStart,
    periodEnd,
    periodKey,
    currentPlanTier: activePlan,
    planName: activePlan,
    planLabel: getPlanLabel(activePlan),
    subscriptionStatus,
    accountStatus,
    isTrial: isActiveTrial,
    trialEndsAt: isActiveTrial ? periodEnd : null,
    pendingPlanTier: companyWithBilling.pending_plan_tier || null,
    pendingPlanEffectiveAt: getPendingPlanEffectiveAt(companyWithBilling),
    planChangeEffectiveAt: getPendingPlanEffectiveAt(companyWithBilling),
    amountPaid: paidAmount,
    currentBalance,
  };
}

export async function reconcileCompanyBilling(companyId: string) {
  const supabaseAdmin = createSupabaseAdmin();
  const summary = await getCurrentBillingSummary(companyId);
  const { data: allPaidTransactions } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("company_id", companyId)
    .eq("status", "paid");

  const amountPaid = (allPaidTransactions || []).reduce(
    (sum: number, transaction: { amount?: number | string | null }) =>
      sum + Number(transaction.amount || 0),
    0
  );

  await updateCompanyWithOptionalHardLock(supabaseAdmin, companyId, {
    current_balance: summary.currentBalance,
    amount_paid: amountPaid,
    subscription_status: summary.currentBalance > 0 ? "unpaid" : "active",
    is_locked: summary.currentBalance > 0,
    hard_locked: summary.currentBalance > 0,
  });

  return summary;
}

export async function canCompanyRegisterVisitor(companyId: string) {
  const summary = await getCurrentBillingSummary(companyId);
  if (summary.company.hard_locked || summary.accountStatus === "locked") {
    return {
      allowed: false,
      summary,
      reason: "hard_locked" as const,
    };
  }

  if (summary.currentBalance > 0) {
    return {
      allowed: true,
      summary,
      reason: "outstanding_balance" as const,
    };
  }

  return {
    allowed: true,
    summary,
    reason: "ok" as const,
  };
}
