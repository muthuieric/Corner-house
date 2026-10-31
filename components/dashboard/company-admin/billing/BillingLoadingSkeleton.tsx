"use client";

export default function BillingLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
      <div className="lg:col-span-1 space-y-4">
        <div className="h-64 bg-zinc-200 rounded-xl w-full"></div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="h-12 bg-zinc-200 rounded-xl w-full"></div>
        <div className="h-96 bg-zinc-200 rounded-xl w-full"></div>
      </div>
    </div>
  );
}
