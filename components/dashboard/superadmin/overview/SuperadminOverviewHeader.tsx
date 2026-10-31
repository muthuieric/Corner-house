"use client";

import { CircuitBoard } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export default function SuperadminOverviewHeader() {
  return (
    <PageHeader
      title="Platform Home"
      eyebrow="Superadmin command center"
      description="Real-time workspace, revenue, guard, and visitor analytics across the network."
      icon={CircuitBoard}
    />
  );
}
