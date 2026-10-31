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
      response.CheckoutRequestID ||
      response.CheckoutRequestId ||
      response.checkout_request_id ||
      response.checkoutRequestId ||
      response.reference ||
      externalReference;

    const refString = String(checkoutRequestId);

    await executeQuery(
      `UPDATE public.parking_sessions 
       SET payhero_ref = $1, 
           phone_number = $2, 
           amount_due = $3 
       WHERE id = $4`,
      [refString, phone, Number(amount), sessionId]
    );

    // Record pending transaction in Neon
    try {
      await executeQuery(
        `INSERT INTO public.transactions (
           amount, currency, provider, provider_reference, checkout_request_id,
           external_reference, phone_number, status, raw_initiate_response
         ) VALUES ($1, 'KES', 'payhero', $2, $2, $3, $4, 'pending', $5)
         ON CONFLICT (provider, provider_reference) DO UPDATE
         SET updated_at = now()`,
        [
          Number(amount),
          refString,
          externalReference,
          phone,
          JSON.stringify(response),
        ]
      );
    } catch (txErr) {
      console.warn("Could not log parking transaction to transactions table:", txErr);
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      reference: refString,
      message: response.message || "M-Pesa prompt sent. Complete payment on your phone.",
    });
  } catch (error: any) {
    console.error("Parking pay error:", error);
    return NextResponse.json({ error: error.message || "Payment failed" }, { status: 500 });
  }
}
