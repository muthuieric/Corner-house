import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    await executeQuery(
      `UPDATE parking_sessions SET status = 'PAID' WHERE id = $1`,
      [sessionId]
    );
    return NextResponse.json({ success: true, message: "Payment acknowledged. You have 15 minutes to exit." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
