import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppSurfaceProps = {
  children: ReactNode;
  className?: string;
  variant?: "admin" | "guard" | "superadmin" | "public";
};

export function AppSurface({ children, className }: AppSurfaceProps) {
  return (
    <div className={cn("min-h-full bg-[#F8FAFC]", className)}>
      {children}
    </div>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-7 p-4 md:p-6 lg:p-8", className)}>
      {children}
    </div>
  );
}
