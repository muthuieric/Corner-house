// app/api/digitax/sale-status/route.ts
// GET /api/digitax/sale-status?sessionId=<uuid>
// Returns the DigiTax eTIMS status for a parking session.

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";
import { getSaleStatus } from "@/lib/digitax";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
    }

    const { rows } = await executeQuery(
      `SELECT id, plate_number, status, amount_paid, paid_at, mpesa_receipt_number,
              digitax_sale_id, digitax_item_id, etims_receipt_number, invoice_number,
              etims_receipt_url, digitax_status, digitax_error, digitax_submitted_at
       FROM public.parking_sessions WHERE id = $1 LIMIT 1`,
      [sessionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = rows[0];

    // Optionally refresh from DigiTax API if we have a sale ID and status isn't final
    let liveStatus: Record<string, unknown> | null = null;
    if (
      session.digitax_sale_id &&
      session.digitax_status === "submitted" &&
      !session.etims_receipt_number &&
      process.env.DIGITAX_API_KEY
    ) {
      try {
        liveStatus = await getSaleStatus(session.digitax_sale_id) as Record<string, unknown>;
        // Update DB with fresh receipt number if available
        if (liveStatus?.etims_receipt_number) {
          await executeQuery(
            `UPDATE public.parking_sessions
             SET etims_receipt_number = $1,
                 etims_receipt_url    = $2,
                 digitax_response     = $3
             WHERE id = $4`,
            [
              liveStatus.etims_receipt_number,
              liveStatus.receipt_url || session.etims_receipt_url,
              JSON.stringify(liveStatus),
              sessionId,
            ]
          );
        }
      } catch (refreshErr) {
        console.warn("[DigiTax] Could not refresh sale status:", refreshErr);
      }
    }

    return NextResponse.json({
      session_id: session.id,
      plate_number: session.plate_number,
      payment_status: session.status,
      amount_paid: session.amount_paid,
      paid_at: session.paid_at,
      mpesa_receipt: session.mpesa_receipt_number,
      digitax: {
        status: session.digitax_status,
        sale_id: session.digitax_sale_id,
        invoice_number: session.invoice_number,
        etims_receipt_number: (liveStatus?.etims_receipt_number as string) || session.etims_receipt_number,
        etims_receipt_url: (liveStatus?.receipt_url as string) || session.etims_receipt_url,
        submitted_at: session.digitax_submitted_at,
        error: session.digitax_error,
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message || "Failed to get sale status" }, { status: 500 });
  }
}

