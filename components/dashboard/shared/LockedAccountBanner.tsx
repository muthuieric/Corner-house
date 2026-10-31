import { AlertOctagon } from "lucide-react";

import { cn } from "@/lib/utils";

type LockedAccountBannerProps = {
  title?: string;
  message: string;
  className?: string;
};

export function LockedAccountBanner({
  title = "Limited functionality",
  message,
  className,
}: LockedAccountBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-center gap-3 border-b border-destructive/20 bg-destructive px-4 py-3 text-sm font-semibold text-white shadow-sm",
        className
      )}
    >
      <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <span className="font-bold">{title}:</span> {message}
      </span>
    </div>
  );
}
