import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 shadow-sm">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" stroke="currentColor" />
          <path d="M7 8h10M7 12h10M7 16h6" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Corner House</h1>
        <p className="max-w-lg text-slate-500">
          Generate a payment QR code for a guest. A fixed 10 bob service charge is added to
          every bill, so if a guest should pay <span className="font-bold text-slate-900">100 KES</span>,
          the QR encodes <span className="font-bold text-slate-900">110 KES</span> to pay.
        </p>
      </div>

      <Link
        href="/pay"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7h18v2L7 20l2-6h9" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
        </svg>
        Generate payment QR
      </Link>
    </main>
  );
}
