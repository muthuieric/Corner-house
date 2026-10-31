// app/api/payhero/callback/route.ts

import { NextResponse } from "next/server";
import { createSupabaseAdmin, markCompanyPaymentSuccessful, reconcileCompanyBilling } from "@/lib/billing/server";
import { getPayHeroExternalReference, getPayHeroReference, normalizePayHeroProviderStatus } from "@/lib/payhero";
import { getSafeErrorResponse } from "@/lib/api-auth";
import { safeNumber } from "@/lib/validation";
import { executeQuery } from "@/lib/pg-client";

function getPayloadValue(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null) return payload[key];
  }
  return null;
}

function companyIdFromExternalReference(reference: string) {
  const match = reference.match(/^KRB-([0-9a-f-]{36})-/i);
  return match?.[1] || null;
}

function getCallbackStatus(payload: Record<string, unknown>) {
  return normalizePayHeroProviderStatus(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = (body.response && typeof body.response === "object" ? body.response : body) as Record<string, unknown>;
    const providerReference = getPayHeroReference(payload);
    const externalReference = getPayHeroExternalReference(payload);
    const status = getCallbackStatus(payload);

    if (!providerReference && !externalReference) {
      return NextResponse.json({ error: "Missing PayHero transaction reference." }, { status: 400 });
    }

    // 1. Check if this is a parking session payment (starts with PARK- or matches parking_sessions payhero_ref)
    const isParkingRef = externalReference.startsWith("PARK-");
    let parkingSessionId: string | null = null;
    if (isParkingRef) {
      const match = externalReference.match(/^PARK-([0-9a-f-]{36})/i);
      parkingSessionId = match?.[1] || null;
    }

    let parkingSession: any = null;
    if (parkingSessionId) {
      const pRes = await executeQuery(
        `SELECT * FROM public.parking_sessions WHERE id = $1 LIMIT 1`,
        [parkingSessionId]
      );
      if (pRes.rows.length > 0) parkingSession = pRes.rows[0];
    }
    if (!parkingSession && providerReference) {
      const pRes = await executeQuery(
        `SELECT * FROM public.parking_sessions WHERE payhero_ref = $1 LIMIT 1`,
        [providerReference]
      );
      if (pRes.rows.length > 0) parkingSession = pRes.rows[0];
    }

    if (parkingSession) {
      const providerAmount = safeNumber(
        getPayloadValue(payload, ["Amount", "amount"]),
        Number(parkingSession.amount_due || 0)
      );
      const receiptNumber = String(
        getPayloadValue(payload, ["MpesaReceiptNumber", "TransactionReceipt", "mpesa_receipt_number"]) || ""
      );
      const phoneNumber = String(
        getPayloadValue(payload, ["Phone", "phone", "phone_number", "PhoneNumber"]) || parkingSession.phone_number || ""
      );

      if (status === "paid") {
        // Update parking_sessions table in Neon
        await executeQuery(
          `UPDATE public.parking_sessions 
           SET status = 'PAID', 
               amount_paid = $1, 
               paid_at = now(), 
               mpesa_receipt_number = $2, 
               phone_number = $3 
           WHERE id = $4`,
          [providerAmount, receiptNumber, phoneNumber, parkingSession.id]
        );

        // Update or insert transaction in Neon
        await executeQuery(
          `UPDATE public.transactions 
           SET status = 'paid', 
               amount = $1,
               paid_at = now(), 
               mpesa_receipt_number = $2, 
               phone_number = $3,
               raw_callback_payload = $4,
               updated_at = now()
           WHERE provider_reference = $5 OR checkout_request_id = $5 OR external_reference = $6`,
          [
            providerAmount,
            receiptNumber,
            phoneNumber,
            JSON.stringify(body),
            providerReference,
            externalReference,
          ]
        );

        return NextResponse.json({ success: true, status: "paid", sessionId: parkingSession.id });
      } else if (status === "failed" || status === "cancelled") {
        await executeQuery(
          `UPDATE public.parking_sessions 
           SET status = 'FAILED' 
           WHERE id = $1`,
          [parkingSession.id]
        );

        await executeQuery(
          `UPDATE public.transactions 
           SET status = $1, 
               raw_callback_payload = $2,
               updated_at = now()
           WHERE provider_reference = $3 OR checkout_request_id = $3 OR external_reference = $4`,
          [status, JSON.stringify(body), providerReference, externalReference]
        );

        return NextResponse.json({ success: true, status, sessionId: parkingSession.id });
      }

      return NextResponse.json({ success: true, status });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const query = supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("provider", "payhero")
      .or(
        [
          providerReference ? `provider_reference.eq.${providerReference}` : "",
          providerReference ? `checkout_request_id.eq.${providerReference}` : "",
          providerReference ? `tracking_id.eq.${providerReference}` : "",
          externalReference ? `external_reference.eq.${externalReference}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: existingRows, error: fetchError } = await query;
    if (fetchError) {
      throw fetchError;
    }

    const existing = existingRows?.[0];
    const companyId = existing?.company_id || companyIdFromExternalReference(externalReference);
    if (!companyId) {
      return NextResponse.json({ error: "Unable to match callback to a company." }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Unable to match callback to a pending transaction." }, { status: 400 });
    }

    const providerAmount = safeNumber(getPayloadValue(payload, ["Amount", "amount"]), Number(existing.amount || 0));
    const expectedAmount = Number(existing.amount || 0);
    if (status === "paid" && Math.round(providerAmount) !== Math.round(expectedAmount)) {
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          raw_callback_payload: body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      await reconcileCompanyBilling(companyId);
      return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
    }

    const amount = expectedAmount;
    const paidAt = status === "paid" ? existing?.paid_at || new Date().toISOString() : existing?.paid_at || null;
    const reversedAt = status === "reversed" ? new Date().toISOString() : existing?.reversed_at || null;
    const wasAlreadyPaid = String(existing?.status || "").toLowerCase() === "paid";
    const paidPeriod = status === "paid" && paidAt && !wasAlreadyPaid ? await markCompanyPaymentSuccessful(companyId, paidAt, amount) : null;
    const updatePayload = {
      company_id: companyId,
      amount,
      currency: "KES",
      provider: "payhero",
      provider_reference: providerReference || existing?.provider_reference || externalReference,
      checkout_request_id: providerReference || existing?.checkout_request_id || null,
      external_reference: externalReference || existing?.external_reference || null,
      tracking_id: providerReference || existing?.tracking_id || externalReference,
      phone_number: String(getPayloadValue(payload, ["Phone", "phone", "phone_number", "PhoneNumber"]) || existing?.phone_number || ""),
      mpesa_receipt_number: String(getPayloadValue(payload, ["MpesaReceiptNumber", "TransactionReceipt", "mpesa_receipt_number"]) || existing?.mpesa_receipt_number || ""),
      status,
      raw_callback_payload: body,
      updated_at: new Date().toISOString(),
      paid_at: paidAt,
      reversed_at: reversedAt,
      ...(paidPeriod
        ? {
            billing_period_key: paidPeriod.periodKey,
            billing_period_start: paidPeriod.periodStart,
            billing_period_end: paidPeriod.periodEnd,
            current_balance: 0,
          }
        : {}),
    };

    await supabaseAdmin.from("transactions").update(updatePayload).eq("id", existing.id);

    if (status !== "paid") {
      await reconcileCompanyBilling(companyId);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("PayHero callback error:", error);
    const safeError = getSafeErrorResponse(error, "PayHero callback failed.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
