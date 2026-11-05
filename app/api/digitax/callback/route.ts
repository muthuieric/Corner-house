// app/api/digitax/callback/route.ts
// POST: Receives async DigiTax "sale.sync" webhook events from eTIMS.
// DigiTax calls this URL after KRA signs the invoice asynchronously.

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[DigiTax callback] received:", JSON.stringify(body));

    // Expected payload shape (varies by DigiTax version):
    // { event: "sale.sync", data: { id, trader_invoice_number, etims_receipt_number, receipt_url, ... } }
    const data = (body?.data || body) as Record<string, unknown>;
    const saleId = (data?.id || data?.sale_id) as string | undefined;
    const traderInvoiceNumber = data?.trader_invoice_number as string | undefined;
    const etimsReceiptNumber = data?.etims_receipt_number as string | undefined;
    const receiptUrl = (data?.receipt_url || data?.etims_receipt_url) as string | undefined;

    if (!saleId && !traderInvoiceNumber) {
      return NextResponse.json({ error: "Missing sale ID or invoice number" }, { status: 400 });
    }

    // Find the parking session by sale ID or invoice number
    let sessionId: string | null = null;
    if (saleId) {
      const { rows } = await executeQuery(
        `SELECT id FROM public.parking_sessions WHERE digitax_sale_id = $1 LIMIT 1`,
        [saleId]
      );
      if (rows.length > 0) sessionId = rows[0].id;
    }
    if (!sessionId && traderInvoiceNumber) {
      const { rows } = await executeQuery(
        `SELECT id FROM public.parking_sessions WHERE invoice_number = $1 LIMIT 1`,
        [traderInvoiceNumber]
      );
      if (rows.length > 0) sessionId = rows[0].id;
    }

    if (!sessionId) {
      // Not one of our parking sessions — ignore gracefully
      return NextResponse.json({ received: true, matched: false });
    }

    // Update the session with eTIMS confirmation data
    await executeQuery(
      `UPDATE public.parking_sessions
       SET digitax_status       = 'confirmed',
           etims_receipt_number = COALESCE($1, etims_receipt_number),
           etims_receipt_url    = COALESCE($2, etims_receipt_url),
           digitax_response     = $3
       WHERE id = $4`,
      [
        etimsReceiptNumber || null,
        receiptUrl || null,
        JSON.stringify(body),
        sessionId,
      ]
    );

    console.log(`[DigiTax callback] Session ${sessionId} confirmed with receipt: ${etimsReceiptNumber}`);
    return NextResponse.json({ received: true, matched: true, session_id: sessionId });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("[DigiTax callback] error:", e);
    return NextResponse.json({ error: e?.message || "Callback processing failed" }, { status: 500 });
  }
}

