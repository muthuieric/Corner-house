// app/api/digitax/submit-sale/route.ts
// POST: Submit a DigiTax eTIMS invoice for a completed parking session.
// Idempotent: skips if digitax_status is already 'submitted'.

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";
import { submitParkingSale } from "@/lib/digitax";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!process.env.DIGITAX_API_KEY) {
      return NextResponse.json(
        { error: "DIGITAX_API_KEY is not configured." },
        { status: 503 }
      );
    }

    // Load session
    const { rows } = await executeQuery(
      `SELECT * FROM public.parking_sessions WHERE id = $1 LIMIT 1`,
      [sessionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = rows[0];

    if (session.status !== "PAID") {
      return NextResponse.json(
        { error: "Session is not paid. DigiTax invoice can only be submitted for paid sessions." },
        { status: 400 }
      );
    }

    // Idempotency: skip if already submitted
    if (session.digitax_status === "submitted") {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "DigiTax invoice already submitted for this session.",
        digitax_sale_id: session.digitax_sale_id,
        etims_receipt_number: session.etims_receipt_number,
      });
    }

    // Submit
    const result = await submitParkingSale({
      sessionId: session.id,
      amountPaid: Number(session.amount_paid || session.amount_due || 0),
      paidAt: session.paid_at || new Date().toISOString(),
      plateNumber: session.plate_number,
      mpesaRef: session.mpesa_receipt_number || undefined,
    });

    // Determine status — mock responses don't have an etims_receipt_number
    const isMock = !!(result as { _mock?: boolean })._mock;
    const digitaxStatus = isMock ? "mock" : "submitted";

    // Save response to DB
    await executeQuery(
      `UPDATE public.parking_sessions
       SET digitax_sale_id      = $1,
           digitax_item_id      = $2,
           etims_receipt_number = $3,
           invoice_number       = $4,
           etims_receipt_url    = $5,
           digitax_status       = $6,
           digitax_error        = NULL,
           digitax_submitted_at = now(),
           digitax_response     = $7
       WHERE id = $8`,
      [
        result.id,
        process.env.DIGITAX_ITEM_ID || null,
        result.etims_receipt_number || null,
        result.trader_invoice_number || null,
        result.receipt_url || null,
        digitaxStatus,
        JSON.stringify(result),
        sessionId,
      ]
    );

    return NextResponse.json({
      success: true,
      digitax_sale_id: result.id,
      invoice_number: result.trader_invoice_number,
      etims_receipt_number: result.etims_receipt_number || null,
      etims_receipt_url: result.receipt_url || null,
      status: digitaxStatus,
      production_enabled: process.env.DIGITAX_PRODUCTION_ENABLED === "true",
    });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: unknown; raw?: unknown };
    console.error("[DigiTax] submit-sale error:", e);

    // Try to save the error to DB (best-effort)
    try {
      const { sessionId } = await request.clone().json();
      if (sessionId) {
        await executeQuery(
          `UPDATE public.parking_sessions
           SET digitax_status = 'failed',
               digitax_error  = $1
           WHERE id = $2`,
          [e?.message || "Unknown error", sessionId]
        );
      }
    } catch {
      // ignore secondary error
    }

    return NextResponse.json(
      { error: e?.message || "Failed to submit DigiTax sale", detail: e?.raw },
      { status: 500 }
    );
  }
}

