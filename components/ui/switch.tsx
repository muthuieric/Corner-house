import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked, defaultChecked, onCheckedChange, disabled, className, ...props }, ref) => {
    const isChecked = checked ?? defaultChecked ?? false;
    return (
      <button
        type="button"
        id={id}
        ref={ref}
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!isChecked)}
        className={cn(
          "inline-flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 text-xs shadow-sm transition",
          isChecked ? "bg-primary" : "bg-surface-muted border border-border",
          disabled && "opacity-60",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow",
            isChecked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";
