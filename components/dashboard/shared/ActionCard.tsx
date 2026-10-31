import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "dark";
};

const toneMap = {
  primary: "from-blue-600 to-blue-500 text-white",
  success: "from-emerald-600 to-emerald-500 text-white",
  warning: "from-orange-500 to-amber-500 text-white",
  danger: "from-red-500 to-rose-500 text-white",
  dark: "from-slate-950 to-slate-800 text-white",
};

export function ActionCard({
  title,
  description,
  icon: Icon,
  action,
  onClick,
  className,
  tone = "primary",
}: ActionCardProps) {
  const content = (
    <Card className={cn("h-full overflow-hidden border-0 bg-gradient-to-br shadow-card", toneMap[tone], className)}>
      <CardContent className="flex min-h-36 flex-col justify-between gap-6 p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold tracking-tight">{title}</p>
            {description && <p className="mt-2 text-sm leading-6 text-white/78">{description}</p>}
          </div>
          {Icon && (
            <div className="rounded-2xl border border-white/20 bg-white/15 p-3 shadow-sm backdrop-blur">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="group block h-full rounded-[1rem] text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        {content}
      </button>
    );
  }

  return (
    content
  );
}
