import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | (string & {});
export type ButtonSize = "default" | "sm" | "lg" | "icon" | "xs" | (string & {});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const base =
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<string, string> = {
  default: "bg-primary text-white hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  outline: "border border-input bg-surface text-text-main hover:bg-surface-muted",
  secondary: "bg-surface-muted text-text-main hover:bg-surface",
  ghost: "text-text-muted hover:bg-surface-muted hover:text-text-main",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<string, string> = {
  default: "h-11 px-4 py-2",
  xs: "h-8 px-3",
  sm: "h-9 px-3",
  lg: "h-12 px-5",
  icon: "h-10 w-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const classes = cn(
      base,
      variantClasses[String(variant) as string] ?? variantClasses.default,
      sizeClasses[String(size) as string] ?? sizeClasses.default,
      className
    );

    if (asChild && isValidElement(children as ReactNode)) {
      return cloneElement(children as ReactElement, {
        ref,
        className: cn((children as ReactElement<{ className?: string }>).props?.className, classes),
      } as any);
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
