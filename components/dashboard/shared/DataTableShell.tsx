import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataTableShellProps = {
  title?: string;
  description?: string;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DataTableShell({
  title,
  description,
  filters,
  children,
  className,
}: DataTableShellProps) {
  return (
    <section className={cn("overflow-hidden rounded-[1.4rem] border border-slate-100 bg-white shadow-sm", className)}>
      {(title || description || filters) && (
        <div className="bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {(title || description) && (
              <div>
                {title && <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>}
                {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
              </div>
            )}
            {filters && <div className="w-full lg:w-auto">{filters}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
