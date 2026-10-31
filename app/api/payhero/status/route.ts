import { NextResponse } from "next/server";
import { createSupabaseAdmin, markCompanyPaymentSuccessful, reconcileCompanyBilling } from "@/lib/billing/server";
import { getPayHeroTransactionStatus, normalizePayHeroProviderStatus } from "@/lib/payhero";
import { assertCompanyAccess, getSafeErrorResponse, requireRole } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference." }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: existingRows } = await supabaseAdmin
      .from("transactions")
      .select("id, company_id, amount, status, paid_at, reversed_at")
      .eq("provider", "payhero")
      .or(`provider_reference.eq.${reference},checkout_request_id.eq.${reference},tracking_id.eq.${reference}`)
      .limit(1);

    const existing = existingRows?.[0];
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const { profile } = await requireRole(req, ["company_admin", "superadmin"]);
    assertCompanyAccess(profile, existing.company_id);

    const statusData = await getPayHeroTransactionStatus(reference);
    const normalizedStatus = normalizePayHeroProviderStatus(statusData);

    const paidAt = normalizedStatus === "paid" ? existing.paid_at || new Date().toISOString() : existing.paid_at;
    const wasAlreadyPaid = String(existing.status || "").toLowerCase() === "paid";
    const paidPeriod =
      normalizedStatus === "paid" && paidAt && !wasAlreadyPaid
        ? await markCompanyPaymentSuccessful(existing.company_id, paidAt, Number(existing.amount || 0))
        : null;

    await supabaseAdmin
      .from("transactions")
      .update({
        status: normalizedStatus,
        raw_callback_payload: statusData,
        updated_at: new Date().toISOString(),
        paid_at: paidAt,
        reversed_at: normalizedStatus === "reversed" ? new Date().toISOString() : existing.reversed_at,
        ...(paidPeriod
          ? {
              billing_period_key: paidPeriod.periodKey,
              billing_period_start: paidPeriod.periodStart,
              billing_period_end: paidPeriod.periodEnd,
              current_balance: 0,
            }
          : {}),
      })
      .eq("id", existing.id);

    if (normalizedStatus !== "paid") {
      await reconcileCompanyBilling(existing.company_id);
    }

    return NextResponse.json({ success: true, status: normalizedStatus });
  } catch (error) {
    console.error("PayHero status error:", error);
    const safeError = getSafeErrorResponse(error, "Payment status could not be checked.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
