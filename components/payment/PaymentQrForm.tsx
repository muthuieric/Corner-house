"use client";

import { useState } from "react";
import { Banknote, Download, QrCode, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";

type QrResult = {
  ok: boolean;
  subtotal: number;
  serviceCharge: number;
  total: number;
  formattedTotal: string;
  reference: string;
  qrDataUrl: string;
};

const DEFAULT_AMOUNT = "100";

export default function PaymentQrForm() {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "loading" | "qr" | "paying">("form");
  const [qr, setQr] = useState<QrResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;

  async function generateQr() {
    if (!validAmount) return;
    setStep("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/payment/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Could not generate the QR code.");
      setQr(data as QrResult);
      setStep("qr");
    } catch (error) {
      alert((error as Error).message);
      setQr(null);
      setStep("form");
    }
  }

  async function payWithMpesa() {
    if (!qr || !phone.trim()) return;
    setStep("paying");
    setMessage(null);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, phoneNumber: phone }),
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : data?.error || "Payment could not be started.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setStep("qr");
    }
  }

  return (
    <div className="grid w-full max-w-xl gap-6">
      <Card className="border-slate-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Pay at Corner House</CardTitle>
              <CardDescription>A flat 10 bob service charge is added. A bill of 100 becomes 110.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="bill-amount" className="text-sm font-bold text-slate-600">
              Amount the guest should pay (KSh)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-0 top-0 flex h-full w-11 items-center justify-center text-slate-400">
                KSh
              </span>
              <Input
                id="bill-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                inputMode="decimal"
                className="h-12 rounded-xl border-slate-200 pl-11 text-lg font-semibold"
              />
            </div>
            {!validAmount && (
              <p className="text-xs font-semibold text-destructive">Enter an amount greater than 0.</p>
            )}
          </div>

          <Button
            className="h-12 w-full bg-blue-600 font-bold text-white hover:bg-blue-700"
            disabled={!validAmount || step === "loading"}
            onClick={generateQr}
          >
            {step === "loading" ? (
              "Generating QR…"
            ) : (
              <>
                <QrCode className="mr-2 h-5 w-5" /> Generate payment QR
              </>
            )}
          </Button>

          {qr ? (
            <>
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="inline-flex items-center justify-center rounded-[1.4rem] border-2 border-slate-100 bg-white p-3 shadow-sm">
                  <img
                    src={qr.qrDataUrl}
                    alt="Corner House payment QR code"
                    className="h-56 w-56 object-contain"
                  />
                </div>
                <p className="text-xs text-slate-500">Scan to pay {qr.formattedTotal}.</p>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill (should pay)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(qr.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service charge</span>
                  <span className="font-semibold text-blue-700">
                    +{formatCurrency(qr.serviceCharge)}{" "}
                    <span className="text-[10px] font-bold uppercase text-slate-400">(10 bob)</span>
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-600">Total to pay</span>
                  <span className="text-2xl font-black text-slate-900">{qr.formattedTotal}</span>
                </div>
              </div>

              <div className="grid gap-2 pt-2">
                <label htmlFor="mpesa-phone" className="text-sm font-bold text-slate-600">
                  M-Pesa phone number (optional)
                </label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <Button
                className="h-12 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                disabled={!phone.trim() || step === "paying"}
                onClick={payWithMpesa}
              >
                {step === "paying" ? (
                  "Requesting STK…"
                ) : (
                  <>
                    <Smartphone className="mr-2 h-5 w-5" /> Pay with M-Pesa
                  </>
                )}
              </Button>

              {message && (
                <p
                  className={
                    "rounded-xl border px-3 py-2 text-xs font-semibold " +
                    (message.toLowerCase().match(/error|could not|invalid|failed/)
                      ? "border-red-100 bg-red-50 text-red-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700")
                  }
                >
                  {message}
                </p>
              )}

              <a
                href={qr.qrDataUrl}
                download={`corner-house-${qr.reference}.png`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" /> Download QR code
              </a>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
