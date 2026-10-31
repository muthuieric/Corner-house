import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ToggleCardProps = {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  checked: boolean;
  disabled?: boolean;
  badge?: ReactNode;
  onCheckedChange: (checked: boolean) => void;
  tone?: "primary" | "success" | "warning";
};

const iconTone = {
  primary: "bg-blue-50 text-blue-600 border-blue-100",
  success: "bg-emerald-50 text-emerald-600 border-emerald-100",
  warning: "bg-orange-50 text-orange-600 border-orange-100",
};

export function ToggleCard({
  id,
  title,
  description,
  icon: Icon,
  checked,
  disabled,
  badge,
  onCheckedChange,
  tone = "primary",
}: ToggleCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition",
        checked && "border-primary/25 bg-primary/5",
        disabled && "opacity-70"
      )}
    >
      <div className="flex min-w-0 gap-3">
        {Icon && (
          <div className={cn("rounded-2xl border p-2.5", iconTone[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={id} className="text-base font-bold">
              {title}
            </Label>
            {badge}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
