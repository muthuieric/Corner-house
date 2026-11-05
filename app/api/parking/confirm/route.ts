import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/pg-client";
import { submitParkingSale } from "@/lib/digitax";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const res = await client.query(`SELECT * FROM parking_sessions WHERE id = $1 FOR UPDATE`, [sessionId]);
      if (res.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      const session = res.rows[0];

      if (session.status !== "PAID") {
        await client.query(`UPDATE parking_sessions SET status = 'PAID', amount_paid = CASE WHEN amount_due > 0 THEN amount_due ELSE 15 END, paid_at = now() WHERE id = $1`, [sessionId]);
      }

      // Idempotency: already submitted
      if (session.digitax_sale_id || session.digitax_status === "submitted") {
        await client.query("COMMIT");
        return NextResponse.json({ success: true, status: "PAID", message: "Payment already confirmed and invoiced." });
      }

      // Reserve submission
      await client.query(`UPDATE parking_sessions SET digitax_status = 'submitting' WHERE id = $1`, [sessionId]);
      await client.query("COMMIT");

      // Submit (outside transaction to avoid holding lock during network call)
      try {
      const result = await submitParkingSale({
        sessionId,
        amount: (Number(session.amount_paid) > 0 ? Number(session.amount_paid) : (Number(session.amount_due) > 0 ? Number(session.amount_due) : 15)),
        saleDate: new Date().toISOString().split("T")[0],
      });
        const c2 = await pool.connect();
        await c2.query(
          `UPDATE parking_sessions SET digitax_sale_id=$1, invoice_number=$2, etims_receipt_url=$3, digitax_status='submitted', digitax_submitted_at=now(), digitax_error=NULL WHERE id=$4 AND digitax_status='submitting'`,
          [result.id, String(result.invoice_number), result.etims_url || result.offline_url || null, sessionId]
        );
        c2.release();
      } catch (e) {
        const c2 = await pool.connect();
        await c2.query(`UPDATE parking_sessions SET digitax_status='failed', digitax_error=$1 WHERE id=$2 AND digitax_status='submitting'`, [String(e), sessionId]);
        c2.release();
      }

      return NextResponse.json({ success: true, status: "PAID", message: "Payment confirmed!" });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
