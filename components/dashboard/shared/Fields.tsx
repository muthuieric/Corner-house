import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, description, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {description && !error && <p className="text-xs leading-5 text-text-muted">{description}</p>}
      {error && <p className="text-xs font-semibold leading-5 text-destructive">{error}</p>}
    </div>
  );
}

export function SearchInput({
  className,
  inputClassName,
  ...props
}: React.ComponentProps<typeof Input> & { inputClassName?: string }) {
  const ariaLabel = props["aria-label"] ?? (typeof props.placeholder === "string" ? props.placeholder : "Search");

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input className={cn("pl-9", inputClassName)} aria-label={ariaLabel} {...props} />
    </div>
  );
}

export function SelectField({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  const ariaLabel = props["aria-label"] ?? "Select option";

  return (
    <select
      aria-label={ariaLabel}
      className={cn(
        "min-h-10 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm font-medium text-text-main shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
