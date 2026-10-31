"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Building2, CalendarDays, Clock, Receipt, WalletCards } from "lucide-react";

import { PageContainer } from "@/components/dashboard/shared/AppShell";
import { DataTableShell } from "@/components/dashboard/shared/DataTableShell";
import { SearchInput } from "@/components/dashboard/shared/Fields";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EmptyState, LoadingState } from "@/components/dashboard/shared/StateBlocks";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { WorkspaceLogo } from "@/components/dashboard/shared/WorkspaceLogo";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  created_at: string;
  amount: number;
  tracking_id: string;
  provider_reference: string | null;
  checkout_request_id: string | null;
  provider: string | null;
  plan_name: string | null;
  status: string;
  companies: { name: string; logo_url?: string | null } | null;
};

type TransactionRow = Omit<Transaction, "companies"> & {
  companies: { name: string; logo_url?: string | null } | { name: string; logo_url?: string | null }[] | null;
};

function normalizeStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "success" || normalized === "paid") return "completed";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "reversed") return "failed";
  if (normalized === "pending") return "pending";
  return normalized;
}

export default function SuperadminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("id, created_at, amount, tracking_id, provider_reference, checkout_request_id, provider, plan_name, status, companies(name)")
        .select("id, created_at, amount, tracking_id, provider_reference, checkout_request_id, provider, plan_name, status, companies(name, logo_url)")
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      const formattedData: Transaction[] = ((txData || []) as TransactionRow[]).map((tx) => ({
        id: tx.id,
        created_at: tx.created_at,
        amount: tx.amount,
        tracking_id: tx.tracking_id,
        provider_reference: tx.provider_reference,
        checkout_request_id: tx.checkout_request_id,
        provider: tx.provider,
        plan_name: tx.plan_name,
        status: tx.status,
        companies: Array.isArray(tx.companies) ? tx.companies[0] : tx.companies,
      }));

      setTransactions(formattedData);
    } catch (err: unknown) {
      console.error("Error fetching master transactions:", err);
      setError(err instanceof Error ? err.message : "An error occurred while loading the global transaction history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchTransactions();
    });

    const channel = supabase
      .channel("global_transactions_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((tx) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (tx.companies?.name || "").toLowerCase().includes(query) ||
      tx.tracking_id.toLowerCase().includes(query);

    let matchesDate = true;
    const txDate = new Date(tx.created_at).getTime();

    if (startDate) {
      matchesDate = matchesDate && txDate >= new Date(startDate).getTime();
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && txDate <= end.getTime();
    }

    return matchesSearch && matchesDate;
  });

  const completedTransactions = transactions.filter((tx) => normalizeStatus(tx.status) === "completed");
  const totalRevenue = completedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const pendingTransactions = transactions.filter((tx) => normalizeStatus(tx.status) === "pending").length;

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        title="Payments"
        eyebrow="Revenue operations"
        description="View every transaction processed across all workspaces with searchable payment history."
        icon={Receipt}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Revenue" value={`KES ${totalRevenue.toLocaleString()}`} description="Completed platform payments" icon={WalletCards} tone="success" />
        <StatCard label="Payment History" value={transactions.length.toLocaleString()} description="All recorded transactions" icon={Receipt} tone="primary" />
        <StatCard label="Pending" value={pendingTransactions.toLocaleString()} description="Awaiting payment confirmation" icon={Clock} tone="warning" />
      </div>

      <DataTableShell
        title="Payment History"
        description="Real-time PayHero receipts across the platform."
        filters={
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] lg:w-[42rem]">
            <SearchInput
              placeholder="Search workspace or tracking ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Start date" />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="End date" />
          </div>
        }
      >
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading payments..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No transactions found" description="No payments have been recorded on the platform yet." icon={Receipt} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No matching results" description="Try adjusting your search or filters." />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6">Date & Time</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>PayHero Reference</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="pl-6 text-sm text-slate-600">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <WorkspaceLogo name={tx.companies?.name} logoUrl={tx.companies?.logo_url} size="sm" />
                          <span className="block max-w-[200px] truncate">{tx.companies?.name || "Unknown Workspace"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">KES {tx.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs tracking-tight text-slate-500">
                        {tx.provider_reference || tx.checkout_request_id || tx.tracking_id}
                      </TableCell>
                      <TableCell className="text-sm font-semibold capitalize text-slate-600">
                        {tx.plan_name || "Legacy"}
                      </TableCell>
                      <TableCell className="pr-6">
                        <StatusBadge status={normalizeStatus(tx.status)}>{tx.status}</StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <WorkspaceLogo name={tx.companies?.name} logoUrl={tx.companies?.logo_url} size="sm" />
                        <span className="line-clamp-2">{tx.companies?.name || "Unknown Workspace"}</span>
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right font-bold text-emerald-600">KES {tx.amount.toLocaleString()}</div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <StatusBadge status={normalizeStatus(tx.status)}>{tx.status}</StatusBadge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ref ID</span>
                    <span className="font-mono text-xs tracking-tight text-slate-600">
                      {tx.provider_reference || tx.checkout_request_id || tx.tracking_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DataTableShell>
    </PageContainer>
  );
}
