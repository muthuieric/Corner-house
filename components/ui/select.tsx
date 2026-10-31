import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectValueT = string | number;

export type SelectProps = {
  children: React.ReactNode;
  value?: SelectValueT;
  defaultValue?: SelectValueT;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

export const Select = ({
  children,
  value,
  defaultValue,
  onValueChange,
}: SelectProps) => {
  return (
    <select
      defaultValue={defaultValue ?? value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className="block w-full cursor-pointer rounded-xl border border-input bg-surface px-3 py-2 text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {children}
    </select>
  );
};

export const SelectTrigger = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <>{children}</>
);
export const SelectValue = ({ placeholder }: { placeholder?: string }) =>
  placeholder ? <option value="" disabled hidden>{placeholder}</option> : null;
export const SelectContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const SelectItem = ({
  value,
  children,
  className,
  ...props
}: { value: string; children?: React.ReactNode; className?: string } & ButtonHTMLAttributes<HTMLOptionElement>) => (
  <option value={value} className={className} {...props}>
    {children}
  </option>
);
export const SelectLabel = ({ children }: { children?: React.ReactNode }) => <optgroup label={typeof children === "string" ? children : ""}>{null}</optgroup>;
export const SelectSeparator = () => null;
