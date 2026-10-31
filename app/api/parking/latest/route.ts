import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function GET(request: Request) {
  try {
    const result = await executeQuery(
      `SELECT id, plate_number, entry_time FROM parking_sessions WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ active: false });
    }

    const session = result.rows[0];
    const baseUrl = new URL(request.url).origin;

    return NextResponse.json({
      active: true,
      sessionId: session.id,
      plateNumber: session.plate_number,
      paymentUrl: `${baseUrl}/parking/pay/${session.id}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch latest entry" }, { status: 500 });
  }
}