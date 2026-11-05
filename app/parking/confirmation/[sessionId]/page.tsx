"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ConfirmationPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/parking/session/${sessionId}`).then(r => r.json()).then(setSession);
  }, [sessionId]);

  if (!session) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-green-700">✅ Payment Confirmed</h1>
        <p className="text-sm text-slate-500">eTIMS receipt (sandbox).</p>
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between"><span>Plate:</span><span className="font-bold">{session.plateNumber}</span></div>
          <div className="flex justify-between"><span>Amount Paid:</span><span className="font-bold">KES {session.amountDue}</span></div>
          <div className="flex justify-between"><span>Time Parked:</span><span className="font-bold">{session.durationMinutes} mins</span></div>
          <div className="flex justify-between"><span>Status:</span><span className="font-bold">{session.status}</span></div>
        </div>
        <button onClick={() => window.print()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Print Receipt</button>
      </div>
    </div>
  );
}
