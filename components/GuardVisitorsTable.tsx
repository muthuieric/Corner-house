"use client";

import type { ReactNode } from "react";

/**
 * Stub for the in-progress Karibu VMS guard visitors table.
 * The real table is populated from Supabase; this placeholder keeps the build
 * green while the dashboard scaffold is connected.
 */
export default function GuardVisitorsTable(_props: Record<string, unknown>): ReactNode {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-10 text-center text-sm font-medium text-slate-500">
      Visitor table coming soon
    </div>
  );
}
