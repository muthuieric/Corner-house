"use client";

import { Clock, Loader2, LogIn, LogOut } from "lucide-react";
import { ModalShell } from "@/components/dashboard/shared/ModalShell";
import { WorkspaceLogo } from "@/components/dashboard/shared/WorkspaceLogo";

type VisitorStats = {
  total: number;
  inside: number;
  departed: number;
  pending: number;
};

type CompanyVisitorStatsModalProps = {
  companyName: string;
  companyLogoUrl?: string | null;
  visitorStats: VisitorStats;
  loadingVisitors: boolean;
  onClose: () => void;
};

export default function CompanyVisitorStatsModal({
  companyName,
  companyLogoUrl,
  visitorStats,
  loadingVisitors,
  onClose,
}: CompanyVisitorStatsModalProps) {
  const modalTitle = (
    <div className="flex items-center gap-3">
      <WorkspaceLogo name={companyName} logoUrl={companyLogoUrl} size="md" />
      <span className="truncate">{companyName}</span>
    </div>
  );

  return (
    <ModalShell title={modalTitle} description="Real-time visitor analytics snapshot." onClose={onClose}>
          {loadingVisitors ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="font-medium text-slate-500">Aggregating data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-6 text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Total Lifetime Visitors</p>
                <div className="text-5xl font-black tracking-tighter text-blue-600">
                  {visitorStats.total.toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-orange-100 bg-orange-50 p-4 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{visitorStats.pending}</div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{visitorStats.inside}</div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Inside</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{visitorStats.departed}</div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Departed</p>
                </div>
              </div>
            </div>
          )}
    </ModalShell>
  );
}
