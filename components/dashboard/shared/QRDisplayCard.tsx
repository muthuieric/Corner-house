import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QRDisplayCardProps = {
  title: string;
  description: string;
  qrUrl: string;
  icon?: LucideIcon;
  footer?: ReactNode;
  tone?: "primary" | "warning";
  printClassName?: string;
};

export function QRDisplayCard({
  title,
  description,
  qrUrl,
  icon: Icon,
  footer,
  tone = "primary",
  printClassName,
}: QRDisplayCardProps) {
  const color =
    tone === "warning"
      ? "text-orange-600 bg-orange-50 border-orange-100"
      : "text-blue-600 bg-blue-50 border-blue-100";

  return (
    <Card className={cn("rounded-[1.4rem] border-slate-100 shadow-sm overflow-hidden bg-white", printClassName)}>
      <CardHeader className="items-center text-center">
        {Icon && (
          <div className={cn("mb-2 rounded-2xl border p-3", color)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{title}</CardTitle>
        <CardDescription className="max-w-xs text-slate-500 font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 pb-6">
        <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
          <Image src={qrUrl} alt={title} width={200} height={200} unoptimized className="rounded-lg object-contain" />
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
