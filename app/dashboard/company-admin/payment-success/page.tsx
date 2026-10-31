"use client";

import Link from "next/link";
import { CheckCircle2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Submitted</CardTitle>
          <CardDescription className="mt-2 text-base">
            We are waiting for PayHero to confirm the M-Pesa transaction. Your balance updates automatically after confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard/company-admin/billing">
              <WalletCards className="w-4 h-4" /> View Payments
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
