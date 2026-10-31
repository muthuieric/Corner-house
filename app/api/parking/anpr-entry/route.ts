import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const { plateNumber } = await request.json();

    if (!plateNumber) {
      return NextResponse.json({ error: "Plate number required" }, { status: 400 });
    }

    const cleanPlate = plateNumber.trim().toUpperCase();

    // Expire any existing active session for this plate
    await executeQuery(
      `UPDATE parking_sessions SET status = 'EXPIRED' WHERE plate_number = $1 AND status = 'ACTIVE'`,
      [cleanPlate]
    );

    // Create fresh session
    const result = await executeQuery(
      `INSERT INTO parking_sessions (plate_number, status) VALUES ($1, 'ACTIVE') RETURNING id, plate_number, entry_time`,
      [cleanPlate]
    );

    const session = result.rows[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentUrl = `${baseUrl}/parking/pay/${session.id}`;

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      plateNumber: session.plate_number,
      paymentUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Entry failed" }, { status: 500 });
  }
}