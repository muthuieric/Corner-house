"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, CreditCard, Lock, Search, WalletCards } from "lucide-react";

import { PageContainer } from "@/components/dashboard/shared/AppShell";
import { DataTableShell } from "@/components/dashboard/shared/DataTableShell";
import { SearchInput, SelectField } from "@/components/dashboard/shared/Fields";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EmptyState, LoadingState } from "@/components/dashboard/shared/StateBlocks";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { WorkspaceLogo } from "@/components/dashboard/shared/WorkspaceLogo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlanLabel } from "@/lib/billing/pricing";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  name: string;
  logo_url?: string | null;
  subscription_status: "trial" | "paid" | "unpaid";
  amount_paid: number;
  current_balance?: number | null;
  is_locked: boolean;
  hard_locked?: boolean | null;
  subscription_ends_at: string | null;
  plan_tier?: string | null;
  pending_plan_tier?: string | null;
};

function getBillingStatus(company: Company) {
  if (company.hard_locked || company.is_locked) return "locked";
  if (company.subscription_status === "trial" || company.plan_tier === "trial_basic" || company.plan_tier === "trial_premium") return "trial";
  if (Number(company.current_balance || 0) > 0) return "unpaid";
  return "paid";
}

export default function SuperadminBillingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCompanies = useCallback(async () => {
    if (companies.length === 0) setLoading(true);

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, subscription_status, amount_paid, current_balance, is_locked, hard_locked, created_at, subscription_ends_at, plan_tier, pending_plan_tier")
      .select("id, name, logo_url, subscription_status, amount_paid, current_balance, is_locked, hard_locked, created_at, subscription_ends_at, plan_tier, pending_plan_tier")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching companies:", error);
      setLoading(false);
      return;
    }

    const formattedCompanies = ((data || []) as Company[]).map((company) => ({
      ...company,
      logo_url: company.logo_url || null,
      subscription_status: (company.subscription_status?.toLowerCase() || "trial") as Company["subscription_status"],
      amount_paid: company.amount_paid || 0,
      current_balance: company.current_balance || 0,
      is_locked: company.is_locked || false,
      hard_locked: company.hard_locked || false,
    }));

    setCompanies(formattedCompanies);
    setLoading(false);
  }, [companies.length]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCompanies();
    });

    const channel = supabase
      .channel("companies_billing_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        fetchCompanies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCompanies]);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && Number(company.current_balance || 0) <= 0 && !company.hard_locked && !company.is_locked) ||
      (statusFilter === "unpaid" && Number(company.current_balance || 0) > 0 && !company.hard_locked) ||
      (statusFilter === "trial" && getBillingStatus(company) === "trial") ||
      (statusFilter === "locked" && (company.hard_locked || company.is_locked));

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = companies.reduce((sum, company) => sum + (Number(company.amount_paid) || 0), 0);
  const goodStandingCompanies = companies.filter(
    (company) => !company.is_locked && (Number(company.current_balance || 0) <= 0 || company.subscription_status === "trial")
  ).length;
  const accountsOwing = companies.filter((company) => Number(company.current_balance || 0) > 0 && !company.is_locked).length;

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        title="Revenue"
        eyebrow="Platform finance"
        description="Manage subscription status, expiry dates, lock states, and client revenue health."
        icon={CreditCard}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Revenue" value={`KES ${totalRevenue.toLocaleString()}`} description="Total paid by workspaces" icon={WalletCards} tone="success" />
        <StatCard label="Accounts in Good Standing" value={goodStandingCompanies.toLocaleString()} description="Paid or trial workspaces" icon={Building2} tone="primary" />
        <StatCard label="Accounts Owing" value={accountsOwing.toLocaleString()} description="Workspaces with outstanding balances" icon={Lock} tone={accountsOwing > 0 ? "danger" : "neutral"} />
      </div>

      <DataTableShell
        title="Workspace Revenue"
        description="Live payment and access statuses synchronized with your database."
        filters={
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] lg:w-[34rem]">
            <SearchInput
              placeholder="Search workspace..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <SelectField value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid (Soft Lock)</option>
              <option value="trial">Trial</option>
              <option value="locked">Hard Locked</option>
            </SelectField>
          </div>
        }
      >
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading revenue data..." />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No workspaces found" description="There are no registered workspaces on the platform yet." icon={Building2} />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No matching workspaces" description="Try adjusting your search or filters." icon={Search} />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6">Workspace</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="pr-6 text-right">Total Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const status = getBillingStatus(company);

                    return (
                      <TableRow key={company.id}>
                        <TableCell className="pl-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <WorkspaceLogo name={company.name} logoUrl={company.logo_url} size="sm" />
                            <span className="max-w-[240px] truncate">{company.name}</span>
                            {(company.hard_locked || company.is_locked) && <Lock className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.subscription_ends_at ? (
                            <span className={company.hard_locked || company.is_locked ? "font-bold text-red-600" : "font-medium text-slate-600"}>
                              {new Date(company.subscription_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          ) : (
                            <span className="text-slate-400">No active period</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-semibold capitalize text-slate-600">
                          {getPlanLabel(company.plan_tier)}
                          {company.pending_plan_tier ? <span className="ml-1 text-xs text-blue-600">next: {company.pending_plan_tier}</span> : null}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status}>{status === "locked" ? "Hard Locked" : status === "trial" ? "Trial" : status === "unpaid" ? "Unpaid" : "Paid"}</StatusBadge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-orange-600">
                          KES {Number(company.current_balance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="pr-6 text-right text-sm font-bold text-emerald-600">
                          KES {company.amount_paid.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredCompanies.map((company) => {
                const status = getBillingStatus(company);

                return (
                  <div key={company.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5 font-semibold text-slate-900">
                        <WorkspaceLogo name={company.name} logoUrl={company.logo_url} size="sm" />
                        <span className="line-clamp-2">{company.name}</span>
                        {(company.hard_locked || company.is_locked) && <Lock className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                      </div>
                      <div className="whitespace-nowrap text-right font-bold text-emerald-600">
                        KES {company.amount_paid.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {company.subscription_ends_at ? (
                          <span className={company.hard_locked || company.is_locked ? "font-bold text-red-600" : "font-medium text-slate-600"}>
                            {new Date(company.subscription_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        ) : (
                          <span className="text-slate-400">No active period</span>
                        )}
                      </div>
                      <StatusBadge status={status}>{status === "locked" ? "Hard Locked" : status === "trial" ? "Trial" : status === "unpaid" ? "Unpaid" : "Paid"}</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-600">{getPlanLabel(company.plan_tier)}</span>
                      <span className="font-bold text-orange-600">Balance KES {Number(company.current_balance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DataTableShell>
    </PageContainer>
  );
}
