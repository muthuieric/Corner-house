import { NextResponse } from "next/server";
import { toDataURL } from "qrcode";
import { formatCurrency } from "@/lib/formatters";
import { calculatePaymentTotal, SERVICE_CHARGE_BOB } from "@/lib/payment-amount";

type PrepareQrBody = {
  amount?: number | string;
};

const KES = "KES" as const;

export async function POST(request: Request) {
  let body: PrepareQrBody = {};
  try {
    body = (await request.json()) as PrepareQrBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { subtotal, serviceCharge, total } = calculatePaymentTotal(body.amount);
  if (subtotal <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than 0 to pay." }, { status: 400 });
  }

  const channelId = process.env.PAYHERO_CHANNEL_ID || "karibu";
  const reference = `CORNER-${total}-${Date.now().toString(36)}`;

  // The QR encodes the amount the guest actually pays (bill + 10 bob) so a
  // scanner/app can complete the payment. `total` already includes the service charge.
  const paymentPayload = [
    "karibu-pay",
    `currency=${KES}`,
    `amount=${total}`,
    `service_charge=${SERVICE_CHARGE_BOB}`,
    `subtotal=${subtotal}`,
    `ref=${reference}`,
    `channel=${channelId}`,
    `place=Corner House`,
  ].join("|");

  let qrDataUrl: string;
  try {
    qrDataUrl = await toDataURL(paymentPayload, {
      width: 512,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "Could not generate the payment QR code." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    currency: KES,
    subtotal,
    serviceCharge,
    total,
    formattedTotal: formatCurrency(total),
    reference,
    channelId: process.env.PAYHERO_CHANNEL_ID || null,
    paymentPayload,
    qrDataUrl,
  });
}
