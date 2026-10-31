import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
  tone?: "default" | "danger";
};

export function ModalShell({
  title,
  description,
  children,
  footer,
  onClose,
  className,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 sm:p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={cn("relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-[1.4rem] bg-white shadow-2xl border border-slate-100", className)}>
        <div className="relative shrink-0">
          <Button
            type="button"
            variant="ghost"
            className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 p-0"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="px-6 pt-6 pb-4 pr-14 border-b border-slate-100">
            <h2 id="modal-title" className="text-xl font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{description}</p>}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {footer && (
          <div className="shrink-0 border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50 rounded-b-[1.4rem]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
