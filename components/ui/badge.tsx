import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "pending" | "error" | "info" | (string & {});
  size?: "sm" | "md" | (string & {});
};

const badgeVariants: Record<string, string> = {
  default: "border bg-primary/10 text-primary",
  secondary: "border bg-surface-muted text-text-main",
  destructive: "border bg-destructive/10 text-destructive",
  outline: "border text-text-main",
  success: "border bg-success/10 text-success",
  pending: "border bg-warning/10 text-warning-foreground",
  error: "border bg-destructive/10 text-destructive",
  info: "border bg-blue-100 text-blue-700",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
      size === "sm" ? "px-2 py-0" : "px-2.5 py-0.5",
      badgeVariants[variant as string] ?? badgeVariants.default,
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";
