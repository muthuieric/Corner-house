import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate");
  if (!plate) return NextResponse.json({ error: "plate required" }, { status: 400 });
  const result = await executeQuery(
    `SELECT * FROM parking_sessions WHERE plate_number = $1 AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`,
    [plate.trim().toUpperCase()]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: "No active session" }, { status: 404 });
  const s = result.rows[0];
  const entryTime = new Date(s.entry_time);
  const now = new Date();
  const durationMinutes = Math.max(1, Math.ceil((now.getTime() - entryTime.getTime()) / (1000 * 60)));
  const BASE_CHARGE = 10;
  const SERVICE_FEE = 5;
  const amountDue = BASE_CHARGE + SERVICE_FEE;
  return NextResponse.json({
    sessionId: s.id,
    plateNumber: s.plate_number,
    entryTime: s.entry_time,
    durationMinutes,
    baseAmount: BASE_CHARGE,
    extraAmount: 0,
    serviceFee: SERVICE_FEE,
    amountDue,
    status: s.status,
  });
}
