"use client";

import { Activity, Banknote, Building2, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";

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

type PlatformKpiGridProps = {
  stats: PlatformStats;
};

export default function PlatformKpiGrid({ stats }: PlatformKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} description="Total platform earnings" icon={Banknote} tone="success" />
      <StatCard label="Accounts in Good Standing" value={stats.goodStandingCompanies} description="Paid or trial workspaces" icon={Building2} tone="primary" />
      <StatCard label="Guards" value={stats.totalGuards} description="Active accounts deployed" icon={ShieldCheck} tone="warning" />
      <StatCard label="Accounts Owing" value={stats.accountsOwing} description="Workspaces with outstanding balances" icon={Activity} tone="neutral" />
    </div>
  );
}
