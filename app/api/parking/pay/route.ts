import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";
import { initiatePayHeroPayment } from "@/lib/payhero";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, phoneNumber, amount } = await request.json();
    // Normalize phone to 254 format
    let phone = phoneNumber.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    if (phone.startsWith("+")) phone = phone.slice(1);
    if (!/^254[17]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const channelId = process.env.PAYHERO_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json({ error: "Missing channel" }, { status: 500 });
    }

    const externalReference = `PARK-${sessionId}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = process.env.PAYHERO_CALLBACK_URL || `${appUrl}/api/payhero/callback`;

    const response = await initiatePayHeroPayment({
      amount: Number(amount),
      phoneNumber: phone,
      channelId,
      externalReference,
      callbackUrl,
    });

    const checkoutRequestId =
      response.CheckoutRequestID || response.CheckoutRequestId || response.checkout_request_id || response.checkoutRequestId || response.reference;

    await executeQuery(
      `UPDATE parking_sessions SET payhero_ref = $1 WHERE id = $2`,
      [String(checkoutRequestId || externalReference), sessionId]
    );

    return NextResponse.json({
      success: true,
      status: "pending",
      reference: String(checkoutRequestId || externalReference),
      message: response.message || "M-Pesa prompt sent. Complete payment on your phone.",
    });
  } catch (error: any) {
    console.error("Parking pay error:", error);
    return NextResponse.json({ error: error.message || "Payment failed" }, { status: 500 });
  }
}
