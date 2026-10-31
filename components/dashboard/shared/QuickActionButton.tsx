import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuickActionButtonProps = React.ComponentProps<typeof Button> & {
  icon?: LucideIcon;
  children: ReactNode;
};

export function QuickActionButton({
  icon: Icon,
  children,
  className,
  ...props
}: QuickActionButtonProps) {
  return (
    <Button size="lg" className={cn("min-h-12 flex-1 sm:flex-none", className)} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
}
