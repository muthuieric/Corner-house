import { NextResponse } from "next/server";
import { normalizeKenyanPhoneNumber } from "@/lib/validation";
import { calculatePaymentTotal, SERVICE_CHARGE_BOB } from "@/lib/payment-amount";
import { getAppUrl } from "@/lib/app-url";
import { initiatePayHeroPayment } from "@/lib/payhero";

type InitiateBody = {
  amount?: number | string;
  phoneNumber?: string;
};

export async function POST(request: Request) {
  let body: InitiateBody = {};
  try {
    body = (await request.json()) as InitiateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { subtotal, total } = calculatePaymentTotal(body.amount);
  if (subtotal <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than 0 to pay." }, { status: 400 });
  }

  let phoneNumber: string;
  try {
    phoneNumber = normalizeKenyanPhoneNumber(body.phoneNumber || "");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid Kenyan M-Pesa phone number." },
      { status: 400 }
    );
  }

  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const liveMode = process.env.PAYHERO_ENABLED === "true";

  // Safety: never attempt a real M-Pesa STK push unless the host explicitly opts in.
  if (!liveMode) {
    return NextResponse.json({
      mode: "demo",
      amount: total,
      serviceCharge: SERVICE_CHARGE_BOB,
      currency: "KES",
      phoneNumber,
      reference: `CORNER-${total}-${Date.now().toString(36)}`,
      channelId: channelId || null,
      message: `Payment prepared in DEMO mode: KES ${total} (bill ${subtotal} + 10 bob service charge). Set PAYHERO_ENABLED=true to send a real M-Pesa prompt.`,
    });
  }

  if (!channelId) {
    return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 500 });
  }

  const appUrl = getAppUrl();
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL || `${appUrl}/api/payhero/callback`;
  const externalReference = `CORNER-${phoneNumber}-${total}-${Date.now().toString(36)}`;

  try {
    const response = await initiatePayHeroPayment({
      amount: total,
      phoneNumber,
      channelId,
      externalReference,
      callbackUrl,
    });

    return NextResponse.json({
      mode: "live",
      amount: total,
      serviceCharge: SERVICE_CHARGE_BOB,
      currency: "KES",
      phoneNumber,
      reference: externalReference,
      message: response.message || "M-Pesa prompt sent. Complete the payment on your phone.",
      checkoutRequestId:
        response.CheckoutRequestID ||
        response.CheckoutRequestId ||
        response.checkout_request_id ||
        response.checkoutRequestId ||
        null,
    });
  } catch (error) {
    console.error("PayHero initiate error:", error);
    return NextResponse.json(
      { error: "Payment could not be started. Please try again." },
      { status: 502 }
    );
  }
}
