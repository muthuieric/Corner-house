"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function MobileParkingPay() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSession = async () => {
    const res = await fetch(`/api/parking/session/${sessionId}`);
    const data = await res.json();
    if (res.ok) setSession(data);
  };

  useEffect(() => {
    fetchSession();
    const timer = setInterval(fetchSession, 15000); // Live update duration & fee every 15s
    return () => clearInterval(timer);
  }, [sessionId]);

  const handlePay = async () => {
    if (!phoneNumber) {
      setMessage("Please enter an M-Pesa phone number");
      return;
    }

    setLoading(true);
    setMessage("Triggering M-Pesa STK Push...");

    const res = await fetch("/api/parking/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        phoneNumber,
        amount: session.amountDue,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage("📱 STK Push sent! Enter M-Pesa PIN on your phone.");
    } else {
      setMessage(data.error || "Payment failed to initiate");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-red-50 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-red-200 text-center">
          <h2 className="text-lg font-bold text-red-700">Parking Session Not Found</h2>
          <p className="text-sm text-red-500 mt-2">
            The parking session could not be found. It may have expired or been paid.
          </p>
          <button
            onClick={() => window.location.href = "/api/parking/test-session"}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
          >
            Create Test Session & Pay
          </button>
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
          <div className="flex justify-between text-base border-t pt-2">
            <span>Total Amount:</span>
            <span className="font-bold text-green-600">KES {session.amountDue}</span>
          </div>
        </div>

        {session.status === "PAID" ? (
          <div className="bg-green-100 border border-green-400 text-green-800 p-4 rounded-xl font-bold">
            ✅ Payment Confirmed. Exit Gate Unlocked!
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="07XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border rounded-xl p-3 text-center font-mono text-lg focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl text-lg transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : `PAY KES ${session.amountDue} VIA M-PESA`}
            </button>
            {message && <p className="text-xs font-semibold text-blue-600">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}