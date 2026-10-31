import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const { plateNumber = "KCD 123X" } = await request.json();

    // Expire any existing active session for this plate
    await executeQuery(
      `UPDATE parking_sessions SET status = 'EXPIRED' WHERE plate_number = $1 AND status = 'ACTIVE'`,
      [plateNumber.toUpperCase()]
    );

    // Create fresh session
    const result = await executeQuery(
      `INSERT INTO parking_sessions (plate_number, status) VALUES ($1, 'ACTIVE') RETURNING id, plate_number, entry_time`,
      [plateNumber.toUpperCase()]
    );

    const session = result.rows[0];
    const baseUrl = new URL(request.url).origin;

    // Redirect to the pay page
    return NextResponse.redirect(`${baseUrl}/parking/pay/${session.id}`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create test session" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Return the latest active session for direct testing
  try {
    const result = await executeQuery(
      `SELECT id, plate_number, entry_time FROM parking_sessions WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No active session. POST to create one." }, { status: 404 });
    }

    const session = result.rows[0];
    const baseUrl = new URL(request.url).origin;

    return NextResponse.redirect(`${baseUrl}/parking/pay/${session.id}`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch session" }, { status: 500 });
  }
}