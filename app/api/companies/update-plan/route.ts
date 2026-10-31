import { NextResponse } from "next/server";
import { addOneMonth, calculateMonthlyCharge, isTrialPlan, normalizePlan } from "@/lib/billing/pricing";
import { assertCompanyAccess, getSafeErrorResponse, requireRole } from "@/lib/api-auth";
import { requireBillingPlan, requireUuid } from "@/lib/validation";
import { canChooseVerificationMethod } from "@/lib/visitor-verification";

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "42703" || candidate.code === "PGRST204" || /column .* does not exist|Could not find .* column/i.test(candidate.message || "");
}

export async function POST(request: Request) {
  try {
    const { companyId, planTier } = await request.json();
    const safeCompanyId = requireUuid(companyId, "companyId");
    const newPlan = normalizePlan(requireBillingPlan(planTier));
    const { profile, supabaseAdmin } = await requireRole(request, ["company_admin", "superadmin"]);
    assertCompanyAccess(profile, safeCompanyId);

    if (isTrialPlan(newPlan) && profile.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 403 });
    }

    let companyResult = await supabaseAdmin
      .from("companies")
      .select("created_at, plan_tier, pending_plan_tier, pending_plan_effective_at, billing_period_start, billing_period_end, current_balance, is_locked, hard_locked")
      .eq("id", safeCompanyId)
      .single();

    if (isMissingColumnError(companyResult.error)) {
      companyResult = await supabaseAdmin
        .from("companies")
        .select("created_at, plan_tier, billing_period_start, billing_period_end, current_balance, is_locked")
        .eq("id", safeCompanyId)
        .single();
    }

    const { data: company, error: fetchError } = companyResult;

    if (fetchError) throw fetchError;

    const now = new Date();
    const periodStart = company?.billing_period_start || now.toISOString();
    const periodEnd = company?.billing_period_end || addOneMonth(new Date(periodStart)).toISOString();
    const trialEnd = addOneMonth(now).toISOString();
    let currentBalance = Number(company?.current_balance || 0);
    let subscriptionStatus = "active";
    let isLocked = Boolean(company?.is_locked);
    let hardLocked = Boolean(company?.hard_locked);

    const updatePayload: Record<string, unknown> = {
      plan_tier: newPlan,
      pending_plan_tier: null,
      pending_plan_effective_at: null,
      billing_period_start: isTrialPlan(newPlan) ? now.toISOString() : periodStart,
      billing_period_end: isTrialPlan(newPlan) ? trialEnd : periodEnd,
    };

    if (canChooseVerificationMethod(newPlan)) {
      updatePayload.visitor_verification_method = "qr_pass";
    }

    if (isTrialPlan(newPlan)) {
      currentBalance = 0;
      subscriptionStatus = "trial";
      isLocked = false;
      hardLocked = false;
      updatePayload.subscription_status = subscriptionStatus;
      updatePayload.current_balance = currentBalance;
      updatePayload.is_locked = false;
      updatePayload.hard_locked = false;
      updatePayload.subscription_ends_at = trialEnd;
      updatePayload.subscription_expires_at = trialEnd;
    } else if (newPlan === "custom") {
      currentBalance = 0;
      subscriptionStatus = "active";
      isLocked = false;
      hardLocked = Boolean(company?.hard_locked);
      updatePayload.subscription_status = subscriptionStatus;
      updatePayload.current_balance = currentBalance;
      updatePayload.is_locked = false;
      updatePayload.subscription_ends_at = null;
      updatePayload.subscription_expires_at = null;
    } else {
      const { count, error: visitorsError } = await supabaseAdmin
        .from("visitors")
        .select("id", { count: "exact", head: true })
        .eq("company_id", safeCompanyId)
        .gte("created_at", periodStart)
        .lt("created_at", periodEnd);

      if (visitorsError) throw visitorsError;

      currentBalance = calculateMonthlyCharge(newPlan, count || 0).totalAmount;
      subscriptionStatus = currentBalance > 0 ? "unpaid" : "active";
      if (currentBalance <= 0) {
        isLocked = false;
      }
      updatePayload.subscription_status = subscriptionStatus;
      updatePayload.current_balance = currentBalance;
      updatePayload.is_locked = isLocked;
      updatePayload.subscription_ends_at = null;
      updatePayload.subscription_expires_at = null;
    }

    let { error: updateError } = await supabaseAdmin.from("companies").update(updatePayload).eq("id", safeCompanyId);
    if (isMissingColumnError(updateError)) {
      delete updatePayload.hard_locked;
      const retry = await supabaseAdmin.from("companies").update(updatePayload).eq("id", safeCompanyId);
      updateError = retry.error;
    }

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      newTier: newPlan,
      pendingTier: null,
      effectiveAt: null,
      subscriptionStatus,
      currentBalance,
      isLocked,
      hardLocked,
    });

  } catch (error: unknown) {
    console.error("Update Plan Error:", error);
    const safeError = getSafeErrorResponse(error, "Plan could not be updated.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
