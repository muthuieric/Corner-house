"use client";

import { WalletCards } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export default function BillingHeader() {
  return (
    <PageHeader
      title="Payments"
      description="Manage usage, outstanding balances, and transaction history."
      icon={WalletCards}
    >
    </PageHeader>
  );
}
