"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  const [url, setUrl] = useState("http://localhost:3000/pay");
  useEffect(() => {
    setUrl(`${window.location.origin}/pay`);
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold mb-6">CORNER HOUSE PARKING</h1>
      <div className="bg-white p-5 rounded-2xl inline-block shadow-2xl">
        <QRCode value={url} size={220} />
      </div>
      <p className="text-sm text-slate-400 mt-4">Scan to enter your number plate and pay</p>
      <a href="/pay" className="mt-2 text-blue-400 underline text-sm">Or click here if QR doesn't work</a>
    </div>
  );
}
