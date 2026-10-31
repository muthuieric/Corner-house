"use client";

import { Crown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/shared/StateBlocks";
import { WorkspaceLogo } from "@/components/dashboard/shared/WorkspaceLogo";

type TopCompany = {
  id: string;
  name: string;
  logo_url?: string | null;
  visitors: number;
};

type WorkspaceLeaderboardCardProps = {
  topCompanies: TopCompany[];
};

function getBarWidthClass(percentage: number) {
  if (percentage >= 90) return "w-full";
  if (percentage >= 75) return "w-3/4";
  if (percentage >= 66) return "w-2/3";
  if (percentage >= 50) return "w-1/2";
  if (percentage >= 33) return "w-1/3";
  if (percentage >= 25) return "w-1/4";
  if (percentage >= 20) return "w-1/5";
  if (percentage >= 16) return "w-1/6";
  if (percentage >= 10) return "w-1/12";
  return "w-8";
}

export default function WorkspaceLeaderboardCard({ topCompanies }: WorkspaceLeaderboardCardProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Workspace Leaderboard
            </CardTitle>
            <CardDescription>Most active client buildings by visitor traffic.</CardDescription>
          </div>
          <div className="rounded-lg border border-orange-100 bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
            Platform Rank
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {topCompanies.length === 0 ? (
          <EmptyState title="No visitor data yet" description="Workspace activity will appear here as visits are recorded." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {topCompanies.map((company, index) => {
              const maxVis = topCompanies[0]?.visitors || 1;
              const percentage = Math.max((company.visitors / maxVis) * 100, 5);

              return (
                <div key={company.id} className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div
                    className={`absolute bottom-0 left-0 top-0 z-0 bg-blue-50 transition-all duration-1000 ease-out ${getBarWidthClass(percentage)}`}
                    aria-hidden="true"
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {index === 0 ? (
                        <Crown className="h-5 w-5 text-orange-500" />
                      ) : (
                        <div className="w-5 text-center text-sm font-bold text-slate-400">{index + 1}</div>
                      )}
                      <span className="max-w-[120px] truncate text-sm font-bold text-slate-900">{company.name}</span>
                      <div className="flex items-center gap-2">
                        <WorkspaceLogo name={company.name} logoUrl={company.logo_url} size="xs" />
                        <span className="max-w-[120px] truncate text-sm font-bold text-slate-900">{company.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black leading-none text-blue-600">{company.visitors.toLocaleString()}</div>
                      <p className="mt-0.5 text-[9px] font-bold uppercase text-slate-400">Visits</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
