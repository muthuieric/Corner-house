"use client";

import { useState } from "react";

export default function PayPage() {
  const [plate, setPlate] = useState("");
  const [session, setSession] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const lookup = async () => {
    setLookingUp(true);
    setMessage("");
    await fetch("/api/parking/anpr-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plateNumber: plate }),
    });
    const res = await fetch(`/api/parking/session-by-plate?plate=${encodeURIComponent(plate)}`);
    const data = await res.json();
    setLookingUp(false);
    if (res.ok) setSession(data);
    else setMessage(data.error || "No active session");
  };

  const handlePay = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    setMessage("");
    let phone = phoneNumber.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    const res = await fetch("/api/parking/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId, phoneNumber: phone, amount: session.amountDue }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("📱 STK Push sent! Enter M-Pesa PIN.");
      setSession((prev: any) => ({ ...prev, status: "PAID" }));
    }
    else setMessage(data.error || "Payment failed");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-center">Parking Payment</h1>
          <input
            type="text"
            placeholder="Enter plate e.g. KCD 123X"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="w-full border rounded-xl p-3 text-center font-mono text-lg"
          />
          <button
            onClick={lookup}
            disabled={lookingUp || !plate}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {lookingUp && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />}
            {lookingUp ? "Checking..." : "Check Amount / Pay"}
          </button>
          {message && <p className="text-xs text-red-600 text-center">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border space-y-5 text-center">
        <h2 className="text-lg font-bold text-slate-700">PARKING RECEIPT</h2>
        <div className="bg-yellow-400 text-black text-3xl font-mono py-2 px-4 rounded-lg font-black inline-block">
          {session.plateNumber}
        </div>
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600 border">
          <div className="flex justify-between">
            <span>Time Spent:</span>
            <span className="font-bold text-slate-900">{session.durationMinutes} mins</span>
          </div>
          <div className="flex justify-between">
            <span>Service Fee:</span>
            <span className="font-bold text-slate-900">KES {session.serviceFee}</span>
          </div>
          <div className="flex justify-between text-base border-t pt-2">
            <span>Total Amount:</span>
            <span className="font-bold text-green-600">KES {session.amountDue}</span>
          </div>
        </div>
        {session.status === "PAID" ? (
          <div className="bg-green-100 border border-green-400 text-green-800 p-4 rounded-xl font-bold space-y-2">
            <p>✅ Payment Confirmed. You have 15 minutes to exit.</p>
            <button onClick={() => window.print()} className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold">
              Print Receipt
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="07XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border rounded-xl p-3 text-center font-mono text-lg"
            />
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Sending STK Push...
                </>
              ) : (
                `PAY KES ${session.amountDue} VIA M-PESA`
              )}
            </button>
            {message && <p className="text-xs font-semibold text-blue-600">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
