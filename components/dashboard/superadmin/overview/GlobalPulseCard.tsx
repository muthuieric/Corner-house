"use client";

import { Activity, ArrowUpRight, CheckCircle2, Clock, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlatformStats = {
  totalCompanies: number;
  goodStandingCompanies: number;
  accountsOwing: number;
  totalRevenue: number;
  totalVisitors: number;
  todayVisitors: number;
  totalGuards: number;
  pendingVisitors: number;
  insideVisitors: number;
};

type GlobalPulseCardProps = {
  stats: PlatformStats;
};

export default function GlobalPulseCard({ stats }: GlobalPulseCardProps) {
  return (
    <Card className="flex flex-col border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-blue-600" /> Global Pulse
        </CardTitle>
        <CardDescription>Real-time entrance overview.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-around gap-4 p-6">
        <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-600"><Clock className="h-3.5 w-3.5" /> Pending at Gates</p>
            <p className="text-4xl font-black text-slate-900">{stats.pendingVisitors.toLocaleString()}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600"><LogIn className="h-3.5 w-3.5" /> Currently Inside</p>
            <p className="text-4xl font-black text-slate-900">{stats.insideVisitors.toLocaleString()}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Daily Check-ins</p>
            <p className="text-xl font-bold text-slate-800">{stats.todayVisitors.toLocaleString()}</p>
          </div>
          <div className="mx-4 h-8 w-px bg-slate-200" />
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Avg Daily MRR</p>
            <p className="text-xl font-bold text-slate-800">KES {Math.round(stats.totalRevenue / 30).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
