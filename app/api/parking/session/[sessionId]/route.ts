import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

const HOURLY_RATE = 100; // KES 100 per hour
const GRACE_PERIOD_MINUTES = 15; // First 15 minutes free

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const result = await executeQuery(
      `SELECT * FROM parking_sessions WHERE id = $1 LIMIT 1`,
      [params.sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = result.rows[0];
    const entryTime = new Date(session.entry_time);
    const currentTime = new Date();

    // Calculate time spent in minutes
    const durationMinutes = Math.max(
      1,
      Math.ceil((currentTime.getTime() - entryTime.getTime()) / (1000 * 60))
    );

    // Pricing Rule: KES 100 Base + KES 10 extra for every additional 30 mins (after 15 min grace period)
    const BASE_CHARGE = 100;
    const EXTRA_RATE = 10;
    const GRACE_PERIOD = 15;

    let amountDue = BASE_CHARGE;
    if (durationMinutes > GRACE_PERIOD) {
      const extraMinutes = durationMinutes - GRACE_PERIOD;
      const extraUnits = Math.ceil(extraMinutes / 30);
      amountDue = BASE_CHARGE + extraUnits * EXTRA_RATE;
    }

    return NextResponse.json({
      sessionId: session.id,
      plateNumber: session.plate_number,
      entryTime: session.entry_time,
      durationMinutes,
      amountDue,
      status: session.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}