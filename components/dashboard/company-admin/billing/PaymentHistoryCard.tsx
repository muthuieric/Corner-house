"use client";

import { CheckCircle2, Clock, Receipt, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

type Transaction = {
  id: string;
  created_at: string;
  amount: number;
  tracking_id: string;
  provider?: string | null;
  status: string;
  plan_name?: string | null;
};

type PaymentHistoryCardProps = {
  transactions: Transaction[];
  formatDate: (date: Date | string) => string;
};

export default function PaymentHistoryCard({ transactions, formatDate }: PaymentHistoryCardProps) {
  const shortenReference = (value?: string | null) => {
    if (!value) return "-";
    return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
  };

  return (
    <Card className="shadow-sm border-slate-100 rounded-[1.4rem] overflow-hidden bg-white">
      <CardHeader className="bg-white pb-5">
        <CardTitle className="text-xl font-bold text-slate-900">Payment History</CardTitle>
        <CardDescription>A complete chronological log of your past top-ups and settlements.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Transactions Yet</h3>
            <p className="text-sm font-bold text-slate-500 max-w-sm mt-1">
              When you make your first payment for visitor check-ins, the receipt will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-100">
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs">Date & Time</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs">Reference ID</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Amount</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const statusUpper = tx.status?.toUpperCase() || "PENDING";
                  let StatusIcon = Clock;
                  let statusColor = "text-orange-700 bg-orange-50 border-orange-200";

                  if (statusUpper === "COMPLETED" || statusUpper === "SUCCESS" || statusUpper === "PAID") {
                    StatusIcon = CheckCircle2;
                    statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                  } else if (statusUpper === "FAILED" || statusUpper === "CANCELLED" || statusUpper === "REVERSED") {
                    StatusIcon = XCircle;
                    statusColor = "text-red-700 bg-red-50 border-red-200";
                  }

                  return (
                    <TableRow key={tx.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatDate(tx.created_at)}
                        </div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">
                          {formatDateTime(tx.created_at).split(", ").at(-1)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">
                        {shortenReference(tx.tracking_id)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 whitespace-nowrap text-right">
                        {formatCurrency(Number(tx.amount || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusColor} whitespace-nowrap`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {tx.status || "PENDING"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
