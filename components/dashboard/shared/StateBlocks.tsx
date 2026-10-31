import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Search, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type StateBlockProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
  tone?: "default" | "danger" | "success" | "warning";
};

const toneMap = {
  default: "bg-blue-50 text-blue-600",
  danger: "bg-red-50 text-red-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-orange-50 text-orange-600",
};

export function EmptyState({
  title,
  description,
  icon: Icon = Search,
  children,
  className,
  tone = "default",
}: StateBlockProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[1.4rem] border border-slate-100 bg-slate-50/50 p-8 text-center shadow-sm", className)}>
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm", toneMap[tone])}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-bold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  icon: Icon = AlertCircle,
  children,
  className,
}: StateBlockProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={Icon}
      className={className}
      tone="danger"
    >
      {children}
    </EmptyState>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[1.4rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500 shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-50" />
      ))}
    </div>
  );
}
