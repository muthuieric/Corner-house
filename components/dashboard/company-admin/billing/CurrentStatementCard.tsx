"use client";

import { Calendar, CheckCircle2, Loader2, Receipt, Smartphone, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPlanLabel } from "@/lib/billing/pricing";
import { formatCurrency, formatNumber } from "@/lib/formatters";

type CurrentStatementCardProps = {
  summary: {
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
    isTrial?: boolean;
    trialEndsAt?: string | null;
    planLabel?: string;
  };
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  isPaying: boolean;
  formatDate: (date: Date | string) => string;
  onPayment: () => void;
};

export default function CurrentStatementCard({
  summary,
  phoneNumber,
  onPhoneNumberChange,
  isPaying,
  formatDate,
  onPayment,
}: CurrentStatementCardProps) {
  const amountDue = summary.currentBalance;
  const isTrial = summary.isTrial === true;
  const normalizedPlan = (summary.planName || "").toLowerCase();
  const isBasicFree = normalizedPlan === "basic" || normalizedPlan === "trial_basic";

  return (
    <Card className="shadow-sm border-slate-100 rounded-[1.4rem] h-fit overflow-hidden bg-white">
      <CardHeader className="pb-4 bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Receipt className="w-5 h-5 text-slate-500" />
            Payment Summary
          </CardTitle>
          {isTrial ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              Trial
            </span>
          ) : amountDue > 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          ) : isBasicFree ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Free Plan
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <Calendar className="w-4 h-4" />
            <span>Billing Period</span>
          </div>
          <span className="font-bold text-slate-900">
            {formatDate(summary.periodStart)} - {formatDate(new Date(new Date(summary.periodEnd).getTime() - 1))}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Plan</span>
            <span className="text-slate-900 font-bold text-base">{summary.planLabel || getPlanLabel(summary.planName)}</span>
          </div>
          {isTrial && summary.trialEndsAt && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700">
              Trial active until {formatDate(summary.trialEndsAt)}
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Included Visitors</span>
            <span className="text-slate-900 font-bold text-base">{formatNumber(summary.includedVisitors)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Used Visitors</span>
            <span className="text-slate-900 font-bold text-base">{formatNumber(summary.visitorCount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Extra Visitors</span>
            <span className="text-slate-900 font-bold text-base">{formatNumber(summary.extraVisitors)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Base Price</span>
            <span className="text-slate-900 font-bold text-base">{summary.basePrice === 0 ? "Free (KES 0)" : formatCurrency(summary.basePrice)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Extra Visitor Rate</span>
            <span className="text-slate-900 font-bold text-base">{formatCurrency(summary.extraVisitorRate)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Extra Visitor Charges</span>
            <span className="text-slate-900 font-bold text-base">{formatCurrency(summary.extraVisitorCharges)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">Paid This Period</span>
            <span className="text-slate-900 font-bold text-base">{formatCurrency(summary.amountPaid)}</span>
          </div>

          <div className="pt-4">
            <div className="flex justify-between items-end">
              <span className="text-slate-900 font-bold">Current Balance</span>
              <span className={`text-3xl font-black tracking-tight ${amountDue > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                {formatCurrency(amountDue)}
              </span>
            </div>
          </div>
        </div>

        {summary.pendingPlanTier && summary.planChangeEffectiveAt && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold text-blue-700">
            {getPlanLabel(summary.pendingPlanTier)} starts on {formatDate(summary.planChangeEffectiveAt)}.
          </div>
        )}

        {isBasicFree && amountDue <= 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center">
            <p className="text-sm font-black text-emerald-800">Current Plan: Free (No Payment Due)</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">Your Basic plan includes up to 500 visitors each month at no cost.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="mpesa-phone-number" className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Smartphone className="h-4 w-4" />
                M-Pesa Phone Number
              </label>
              <Input
                id="mpesa-phone-number"
                value={phoneNumber}
                onChange={(event) => onPhoneNumberChange(event.target.value)}
                placeholder="07XXXXXXXX"
                inputMode="tel"
                className="h-11 rounded-xl border-slate-200 font-semibold"
              />
            </div>

            <Button
              onClick={onPayment}
              disabled={isPaying || isTrial || amountDue <= 0 || !phoneNumber.trim()}
              className={`w-full font-bold h-12 shadow-sm rounded-xl transition-all active:scale-[0.98] ${
                amountDue > 0
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isPaying ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : isTrial ? (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Trial Active</>
              ) : amountDue <= 0 ? (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Account Settled</>
              ) : (
                <><WalletCards className="w-5 h-5 mr-2" /> Pay with M-Pesa</>
              )}
            </Button>
          </>
        )}

        {amountDue <= 0 && !isTrial && !isBasicFree && (
          <div className="text-center">
            <p className="text-sm text-emerald-600 font-bold mt-2">
              Your account is fully active!
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              No action required until new visitors arrive.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
