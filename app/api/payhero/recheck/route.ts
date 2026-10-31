import { NextResponse } from "next/server";
import { createSupabaseAdmin, markCompanyPaymentSuccessful, reconcileCompanyBilling } from "@/lib/billing/server";
import { getPayHeroTransactionStatus, normalizePayHeroProviderStatus } from "@/lib/payhero";
import { getSafeErrorResponse, requireRole } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function getStatusReference(transaction: {
  checkout_request_id?: string | null;
  provider_reference?: string | null;
  tracking_id?: string | null;
  external_reference?: string | null;
}) {
  return (
    transaction.checkout_request_id ||
    transaction.provider_reference ||
    transaction.tracking_id ||
    transaction.external_reference ||
    null
  );
}

async function recheckRecentPayHeroTransactions() {
  const supabaseAdmin = createSupabaseAdmin();
  const now = new Date();
  const since = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("id, company_id, amount, status, paid_at, reversed_at, provider_reference, checkout_request_id, tracking_id, external_reference, updated_at")
    .eq("provider", "payhero")
    .in("status", ["pending", "paid", "success", "completed"])
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;

  const results = {
    checked: 0,
    updated: 0,
    reversed: 0,
    failed: 0,
    pending: 0,
    errors: 0,
  };

  for (const transaction of transactions || []) {
    const reference = getStatusReference(transaction);
    if (!reference) continue;

    results.checked += 1;

    try {
      const statusData = await getPayHeroTransactionStatus(reference);
      const normalizedStatus = normalizePayHeroProviderStatus(statusData);
      const currentStatus = String(transaction.status || "").toLowerCase();
      const paidAt = normalizedStatus === "paid" ? transaction.paid_at || now.toISOString() : transaction.paid_at;
      const wasAlreadyPaid = currentStatus === "paid" || currentStatus === "success" || currentStatus === "completed";
      const paidPeriod =
        normalizedStatus === "paid" && paidAt && !wasAlreadyPaid
          ? await markCompanyPaymentSuccessful(transaction.company_id, paidAt, Number(transaction.amount || 0))
          : null;

      await supabaseAdmin
        .from("transactions")
        .update({
          status: normalizedStatus,
          raw_callback_payload: statusData,
          updated_at: now.toISOString(),
          paid_at: paidAt,
          reversed_at: normalizedStatus === "reversed" ? now.toISOString() : transaction.reversed_at,
          ...(paidPeriod
            ? {
                billing_period_key: paidPeriod.periodKey,
                billing_period_start: paidPeriod.periodStart,
                billing_period_end: paidPeriod.periodEnd,
                current_balance: 0,
              }
            : {}),
        })
        .eq("id", transaction.id);

      if (normalizedStatus !== currentStatus) results.updated += 1;
      if (normalizedStatus === "reversed") results.reversed += 1;
      if (normalizedStatus === "failed" || normalizedStatus === "cancelled") results.failed += 1;
      if (normalizedStatus === "pending") results.pending += 1;

      if (normalizedStatus !== "paid") {
        await reconcileCompanyBilling(transaction.company_id);
      }
    } catch (error) {
      results.errors += 1;
      console.error("PayHero recheck failed:", {
        transactionId: transaction.id,
        status: transaction.status,
        error,
      });
    }
  }

  return results;
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["superadmin"]);
    const results = await recheckRecentPayHeroTransactions();
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const safeError = getSafeErrorResponse(error, "PayHero recheck failed.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
