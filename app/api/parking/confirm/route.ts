import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    await executeQuery(
      `UPDATE parking_sessions SET status = 'PAID', amount_paid = amount_due, paid_at = now() WHERE id = $1`,
      [sessionId]
    );
    return NextResponse.json({ success: true, status: "PAID", message: "Payment confirmed!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
