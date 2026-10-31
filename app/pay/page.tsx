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
    try {
      const res = await fetch("/api/parking/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, phoneNumber: phone, amount: session.amountDue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setMessage(data.error || "Payment failed");
        return;
      }
      setMessage("📱 STK Push sent! Enter M-Pesa PIN on your phone.");
      const interval = setInterval(async () => {
        const sRes = await fetch(`/api/parking/session/${session.sessionId}`);
        const sData = await sRes.json();
        if (sData.status === "PAID") {
          clearInterval(interval);
          setLoading(false);
          setSession((prev: any) => ({ ...prev, status: "PAID" }));
        }
      }, 3000);
      setTimeout(() => { clearInterval(interval); setLoading(false); }, 60000);
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
    }
  };

  const handleManualVerify = async () => {
    setLoading(true);
    setMessage("Verifying payment status...");
    const res = await fetch("/api/parking/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.status === "PAID") {
      setSession((prev: any) => ({ ...prev, status: "PAID" }));
      setMessage("✅ Payment confirmed!");
    } else {
      setMessage("Payment not detected yet. Ensure you entered M-Pesa PIN.");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Corner House Parking</h1>
            <p className="text-sm text-slate-500">Enter your number plate to pay</p>
          </div>
          <input
            type="text"
            placeholder="KCD 123X"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="w-full border-2 border-slate-200 rounded-2xl p-4 text-center font-mono text-xl tracking-widest focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={lookup}
            disabled={lookingUp || !plate}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {lookingUp && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />}
            {lookingUp ? "Checking..." : "Check Amount / Pay"}
          </button>
          {message && <p className="text-xs text-red-600 text-center">{message}</p>}
          <p className="text-xs text-slate-400 text-center">Secure M-Pesa payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">PARKING RECEIPT</h2>
          <p className="text-xs text-slate-500">Corner House Parking</p>
        </div>
        <div className="bg-yellow-400 text-black text-3xl font-mono py-3 px-4 rounded-2xl font-black text-center">
          {session.plateNumber}
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm text-slate-600 border">
          <div className="flex justify-between">
            <span>Time Spent:</span>
            <span className="font-bold text-slate-900">{session.durationMinutes} mins</span>
          </div>
          <div className="flex justify-between">
            <span>Base Charge:</span>
            <span className="font-bold text-slate-900">KES {session.baseAmount}</span>
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
          <div className="bg-green-100 border border-green-400 text-green-800 p-4 rounded-2xl font-bold space-y-2 text-center">
            <p>✅ Payment Confirmed</p>
            <p className="text-sm font-normal">Amount Paid: KES {session.amountDue}</p>
            <p className="text-sm font-normal">Time Parked: {session.durationMinutes} mins</p>
            <p className="text-sm font-normal">Exit by: {new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString()}</p>
            <button onClick={() => window.print()} className="bg-white text-green-800 px-4 py-2 rounded-xl font-semibold mt-2">
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
              className="w-full border-2 border-slate-200 rounded-2xl p-3 text-center font-mono text-lg focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            {loading && (
              <button
                onClick={handleManualVerify}
                className="w-full bg-blue-50 border border-blue-300 text-blue-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-100 transition-all"
              >
                Already Paid? Click to Confirm
              </button>
            )}
            <button
              onClick={() => { setLoading(false); setMessage(""); }}
              className="w-full bg-gray-100 text-gray-600 font-semibold py-2 rounded-xl text-sm"
            >
              Cancel / Change Number
            </button>
            {message && <p className="text-xs font-semibold text-blue-600 text-center">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
