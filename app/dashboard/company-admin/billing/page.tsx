"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BillingHeader from "@/components/dashboard/company-admin/billing/BillingHeader";
import BillingLoadingSkeleton from "@/components/dashboard/company-admin/billing/BillingLoadingSkeleton";
import CurrentStatementCard from "@/components/dashboard/company-admin/billing/CurrentStatementCard";
import PaymentHistoryCard from "@/components/dashboard/company-admin/billing/PaymentHistoryCard";
import { PageContainer } from "@/components/dashboard/shared/AppShell";
import { BadgeCheck, UsersRound, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateMonthlyCharge } from "@/lib/billing/pricing";
import { formatCurrency, formatDate, getAccountStatusLabel, formatNumber } from "@/lib/formatters";
import { getAuthHeaders } from "@/lib/client-auth";

type Transaction = {
  id: string;
  created_at: string;
  amount: number;
  tracking_id: string;
  provider?: string | null;
  status: string;
  plan_name?: string | null;
};

type BillingSummary = {
  periodStart: string;
  periodEnd: string;
  planName: string;
  pendingPlanTier?: string | null;
  planChangeEffectiveAt?: string | null;
  visitorCount: number;
  includedVisitors: number;
  extraVisitors: number;
  basePrice: number;
  extraVisitorRate: number;
  extraVisitorCharges: number;
  totalAmount: number;
  amountPaid: number;
  currentBalance: number;
  subscriptionStatus?: string | null;
  accountStatus?: string | null;
  isTrial?: boolean;
  trialEndsAt?: string | null;
  planLabel?: string;
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchBillingData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authData.user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        const authHeaders = await getAuthHeaders();

        const { data: txData } = await supabase
          .from("transactions")
          .select("id, created_at, amount, tracking_id, provider, status, plan_name")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false });

        setTransactions(txData || []);

        const summaryResponse = await fetch(`/api/billing/current?companyId=${profile.company_id}`, {
          headers: authHeaders,
        });
        const billingSummary = await summaryResponse.json();

        if (!summaryResponse.ok) {
          throw new Error(billingSummary.error || "Failed to load billing summary.");
        }

        setSummary(billingSummary);
      }
      setLoading(false);
    };

    fetchBillingData();
  }, []);

  const handlePayment = async () => {
    if (!companyId) return;
    setIsPaying(true);

    try {
      const response = await fetch("/api/payhero/initiate", {
        method: "POST",
        headers: await getAuthHeaders(true),
        body: JSON.stringify({ companyId, phoneNumber }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || "M-Pesa prompt sent. Complete the payment on your phone.");
        const summaryResponse = await fetch(`/api/billing/current?companyId=${companyId}`, {
          headers: await getAuthHeaders(),
        });
        if (summaryResponse.ok) setSummary(await summaryResponse.json());
      } else {
        alert(data.error || "Payment initialization failed.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred starting the payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const fallbackSummary = summary ?? {
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    pendingPlanTier: null,
    planChangeEffectiveAt: null,
    amountPaid: 0,
    currentBalance: 0,
    ...calculateMonthlyCharge("basic", 0),
    subscriptionStatus: "active",
    accountStatus: "settled",
    isTrial: false,
    trialEndsAt: null,
  };

  const accountStatusLabel = getAccountStatusLabel(
    fallbackSummary.isTrial ? "trial" : fallbackSummary.currentBalance > 0 ? "pending_payment" : fallbackSummary.accountStatus
  );

  return (
    <PageContainer className="max-w-6xl space-y-8">
      <BillingHeader />

      {loading ? (
        <BillingLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Current Balance", value: formatCurrency(fallbackSummary.currentBalance), icon: WalletCards, tone: fallbackSummary.currentBalance > 0 ? "text-orange-600 bg-orange-50 border-orange-100" : "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Visitors This Period", value: formatNumber(fallbackSummary.visitorCount), icon: UsersRound, tone: "text-blue-600 bg-blue-50 border-blue-100" },
              { label: "Account Status", value: accountStatusLabel, icon: BadgeCheck, tone: fallbackSummary.currentBalance > 0 ? "text-orange-600 bg-orange-50 border-orange-100" : fallbackSummary.isTrial ? "text-blue-600 bg-blue-50 border-blue-100" : "text-emerald-600 bg-emerald-50 border-emerald-100" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="rounded-[1.4rem] border-slate-100 bg-white shadow-sm">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm font-bold text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                    </div>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
            <CurrentStatementCard
              summary={fallbackSummary}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              isPaying={isPaying}
              formatDate={formatDate}
              onPayment={handlePayment}
            />
            </div>

            <div className="lg:col-span-2">
              <PaymentHistoryCard
                transactions={transactions}
                formatDate={formatDate}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
