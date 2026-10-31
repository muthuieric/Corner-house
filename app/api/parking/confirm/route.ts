import { NextRequest, NextResponse } from "next/server";
import { getPayHeroTransactionStatus, normalizePayHeroProviderStatus, verifyParkingPaymentFromPayHero } from "@/lib/payhero";
import { executeQuery } from "@/lib/pg-client";
import { safeNumber } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Fetch parking session from Neon DB
    const sessionResult = await executeQuery(
      `SELECT * FROM public.parking_sessions WHERE id = $1 LIMIT 1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    // 2. If already marked PAID in Neon, return confirmed immediately
    if (session.status === "PAID") {
      return NextResponse.json({
        success: true,
        status: "PAID",
        amountPaid: Number(session.amount_paid || session.amount_due || 0),
        message: "Payment confirmed! You have 15 minutes to exit.",
      });
    }

    // 3. Check if Neon transactions table already received a paid callback for this session
    if (session.payhero_ref) {
      const txCheck = await executeQuery(
        `SELECT * FROM public.transactions 
         WHERE (provider_reference = $1 OR checkout_request_id = $1)
           AND status = 'paid'
         LIMIT 1`,
        [session.payhero_ref]
      );

      if (txCheck.rows.length > 0) {
        const tx = txCheck.rows[0];
        const paidAmount = Number(tx.amount || session.amount_due || 0);
        const receipt = tx.mpesa_receipt_number || "";

        await executeQuery(
          `UPDATE public.parking_sessions 
           SET status = 'PAID', 
               amount_paid = $1, 
               paid_at = coalesce($2, now()), 
               mpesa_receipt_number = $3 
           WHERE id = $4`,
          [paidAmount, tx.paid_at, receipt, sessionId]
        );

        return NextResponse.json({
          success: true,
          status: "PAID",
          amountPaid: paidAmount,
          message: "Payment confirmed! You have 15 minutes to exit.",
        });
      }
    }

    // 4. Query PayHero transactions ledger directly for this session or phone payment
    const liveVerification = await verifyParkingPaymentFromPayHero(sessionId, session.phone_number);
    if (liveVerification.paid) {
      const paidAmount = liveVerification.amount || Number(session.amount_due || 0);
      const receipt = liveVerification.receipt || "";

      await executeQuery(
        `UPDATE public.parking_sessions 
         SET status = 'PAID', 
             amount_paid = $1, 
             paid_at = now(), 
             mpesa_receipt_number = $2 
         WHERE id = $3`,
        [paidAmount, receipt, sessionId]
      );

      try {
        await executeQuery(
          `INSERT INTO public.transactions (
             amount, currency, provider, provider_reference, checkout_request_id,
             external_reference, phone_number, mpesa_receipt_number, status,
             paid_at
           ) VALUES ($1, 'KES', 'payhero', $2, $3, $4, $5, $6, 'paid', now())`,
          [
            paidAmount,
            receipt || session.payhero_ref || "payhero",
            session.payhero_ref || receipt,
            liveVerification.externalReference || `PARK-${sessionId}`,
            session.phone_number || "",
            receipt,
          ]
        );
      } catch (logErr) {
        // transaction already logged
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        amountPaid: paidAmount,
        message: "Payment confirmed! You have 15 minutes to exit.",
      });
    }

    // 5. If payhero_ref is present, query PayHero API directly for live status
    if (session.payhero_ref) {
      try {
        const statusData = await getPayHeroTransactionStatus(session.payhero_ref);
        const normalizedStatus = normalizePayHeroProviderStatus(statusData);

        if (normalizedStatus === "paid") {
          const providerAmount = safeNumber(
            statusData.Amount || statusData.amount,
            Number(session.amount_due || 0)
          );
          const receipt = String(
            statusData.MpesaReceiptNumber ||
              statusData.TransactionReceipt ||
              statusData.mpesa_receipt_number ||
              ""
          );

          // Update Neon DB: mark parking session as PAID with amount and receipt
          await executeQuery(
            `UPDATE public.parking_sessions 
             SET status = 'PAID', 
                 amount_paid = $1, 
                 paid_at = now(), 
                 mpesa_receipt_number = $2 
             WHERE id = $3`,
            [providerAmount, receipt, sessionId]
          );

          // Update Neon DB: mark transaction as paid
          await executeQuery(
            `UPDATE public.transactions 
             SET status = 'paid', 
                 amount = $1, 
                 paid_at = now(), 
                 mpesa_receipt_number = $2, 
                 raw_callback_payload = $3,
                 updated_at = now() 
             WHERE provider_reference = $4 OR checkout_request_id = $4`,
            [providerAmount, receipt, JSON.stringify(statusData), session.payhero_ref]
          );

          return NextResponse.json({
            success: true,
            status: "PAID",
            amountPaid: providerAmount,
            message: "Payment confirmed! You have 15 minutes to exit.",
          });
        }

        if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
          await executeQuery(
            `UPDATE public.parking_sessions SET status = 'FAILED' WHERE id = $1`,
            [sessionId]
          );

          return NextResponse.json(
            {
              success: false,
              status: "FAILED",
              message: "Payment failed or was cancelled. Please try again.",
            },
            { status: 400 }
          );
        }
      } catch (payHeroErr) {
        console.warn("PayHero live status query error:", payHeroErr);
      }
    }

    // 5. Payment was NOT confirmed yet. Return non-success response so frontend does not falsely confirm.
    return NextResponse.json(
      {
        success: false,
        status: "PENDING",
        message:
          "Payment not detected yet. Ensure you entered your M-Pesa PIN on your phone and wait a moment.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Parking confirm error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Confirmation failed" },
      { status: 500 }
    );
  }
}
