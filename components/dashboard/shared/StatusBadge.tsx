import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeVisitorStatus } from "@/lib/visitor-display";

type StatusBadgeProps = {
  status:
    | "checked_in"
    | "checked_out"
    | "pending"
    | "denied"
    | "blacklisted"
    | "locked"
    | "manual_override"
    | "active"
    | "success"
    | "paid"
    | "failed"
    | "expired"
    | "unpaid"
    | "completed"
    | "trial"
    | "neutral"
    | string;
  children?: ReactNode;
  className?: string;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "pending" | "error" | "info" }> = {
  checked_in: { label: "Inside", variant: "success" },
  active: { label: "Active", variant: "success" },
  success: { label: "Success", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  cancelled: { label: "Cancelled", variant: "error" },
  reversed: { label: "Reversed", variant: "error" },
  expired: { label: "Expired", variant: "error" },
  unpaid: { label: "Unpaid", variant: "error" },
  pending: { label: "Pending", variant: "pending" },
  trial: { label: "Trial", variant: "pending" },
  checked_out: { label: "Checked out", variant: "secondary" },
  neutral: { label: "Neutral", variant: "secondary" },
  denied: { label: "Denied", variant: "error" },
  blacklisted: { label: "Restricted", variant: "error" },
  locked: { label: "Locked", variant: "error" },
  manual_override: { label: "Override", variant: "info" },
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const displayStatus = normalizeVisitorStatus(status);
  const config = statusConfig[displayStatus] ?? { label: displayStatus.replace(/_/g, " "), variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 capitalize", className)}>
      {children ?? config.label}
    </Badge>
  );
}
