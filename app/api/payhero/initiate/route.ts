// app/api/payhero/initiate/route.ts

import { NextResponse } from "next/server";
import { getCurrentBillingSummary, createSupabaseAdmin } from "@/lib/billing/server";
import { initiatePayHeroPayment } from "@/lib/payhero";
import { getAppUrl } from "@/lib/app-url";
import { assertCompanyAccess, getSafeErrorResponse, requireRole } from "@/lib/api-auth";
import { requireKenyanPhoneNumber, requireUuid } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { companyId, phoneNumber } = await req.json();
    const safeCompanyId = requireUuid(companyId, "companyId");
    const normalizedPhone = requireKenyanPhoneNumber(phoneNumber);
    const { profile } = await requireRole(req, ["company_admin", "superadmin"]);
    assertCompanyAccess(profile, safeCompanyId);

    const channelId = process.env.PAYHERO_CHANNEL_ID;
    if (!channelId) {
      console.error("Missing PayHero channel configuration.");
      return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 500 });
    }

    const summary = await getCurrentBillingSummary(safeCompanyId);
    if (summary.company.hard_locked) {
      return NextResponse.json({ error: "Payment could not be started. Please contact support." }, { status: 403 });
    }
    if (summary.isTrial) {
      return NextResponse.json({ error: "Your trial is active. No payment is due." }, { status: 400 });
    }
    if (summary.currentBalance <= 0) {
      return NextResponse.json({ error: "Your current plan is Free or your account has no payment due." }, { status: 400 });
    }

    const appUrl = getAppUrl();
    const callbackUrl = process.env.PAYHERO_CALLBACK_URL || `${appUrl}/api/payhero/callback`;
    const externalReference = `KRB-${safeCompanyId}-${summary.periodKey}-${Date.now()}`;

    const supabaseAdmin = createSupabaseAdmin();
    const recentPending = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("company_id", safeCompanyId)
      .eq("provider", "payhero")
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 60_000).toISOString())
      .limit(1);

    if (recentPending.data?.length) {
      return NextResponse.json(
        { error: "A payment request was already started. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const response = await initiatePayHeroPayment({
      amount: summary.currentBalance,
      phoneNumber: normalizedPhone,
      channelId,
      externalReference,
      callbackUrl,
    });

    const checkoutRequestId =
      response.CheckoutRequestID || response.CheckoutRequestId || response.checkout_request_id || response.checkoutRequestId || response.reference;

    await supabaseAdmin.from("transactions").insert({
      company_id: safeCompanyId,
      amount: summary.currentBalance,
      currency: "KES",
      provider: "payhero",
      tracking_id: String(checkoutRequestId || externalReference),
      provider_reference: String(response.reference || checkoutRequestId || externalReference),
      checkout_request_id: checkoutRequestId ? String(checkoutRequestId) : null,
      external_reference: externalReference,
      phone_number: normalizedPhone,
      status: "pending",
      billing_period_key: summary.periodKey,
      billing_period_start: summary.periodStart,
      billing_period_end: summary.periodEnd,
      plan_name: summary.planName,
      base_price: summary.basePrice,
      included_visitors: summary.includedVisitors,
      extra_visitor_rate: summary.extraVisitorRate,
      visitor_count: summary.visitorCount,
      extra_visitors: summary.extraVisitors,
      extra_visitor_charges: summary.extraVisitorCharges,
      total_amount: summary.totalAmount,
      current_balance: summary.currentBalance,
      raw_initiate_response: response,
    });

    return NextResponse.json({
      success: true,
      status: "pending",
      reference: String(checkoutRequestId || externalReference),
      externalReference,
      message: response.message || "M-Pesa prompt sent. Complete the payment on your phone.",
    });
  } catch (error) {
    console.error("PayHero initiate error:", error);
    const safeError = getSafeErrorResponse(error, "Payment could not be started. Please try again.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
