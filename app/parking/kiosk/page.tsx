"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function ParkingKiosk() {
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    const checkLatest = async () => {
      const res = await fetch("/api/parking/latest");
      const data = await res.json();
      if (res.ok && data.active && data.sessionId !== vehicle?.sessionId) {
        setVehicle(data);
      }
    };

    checkLatest();
    const interval = setInterval(checkLatest, 2000); // Auto-refresh when new car arrives
    return () => clearInterval(interval);
  }, [vehicle]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      {vehicle ? (
        <div className="space-y-6 max-w-md w-full">
          <h1 className="text-2xl font-bold tracking-wider text-slate-400">CORNER HOUSE PARKING</h1>
          <div className="bg-yellow-400 text-black text-4xl font-mono py-2 px-6 rounded-lg font-black inline-block">
            {vehicle.plateNumber}
          </div>
          <div className="bg-white p-5 rounded-2xl inline-block shadow-2xl">
            <QRCode value={vehicle.paymentUrl} size={220} />
          </div>
          <p className="text-sm text-slate-400">Scan QR Code to check parking time and pay on exit</p>
          <div className="bg-white p-4 rounded-xl inline-block shadow-lg text-center">
            <a href={vehicle.paymentUrl} className="text-green-600 font-mono text-sm break-all hover:underline" target="_blank" rel="noopener noreferrer">
              {vehicle.paymentUrl}
            </a>
            <p className="text-xs text-slate-500 mt-1">Copy this link if QR doesn't scan</p>
          </div>
        </div>
      ) : (
        <div className="text-slate-600 text-xl font-mono animate-pulse">
          Waiting for vehicle arrival...
        </div>
      )}
    </div>
  );
}