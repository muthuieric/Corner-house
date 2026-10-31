import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (session.status === "PAID") {
      return NextResponse.json({ success: true, status: "PAID", message: "Payment confirmed!" });
    }
    return NextResponse.json({ success: false, status: session.status, message: "Payment not detected yet." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
