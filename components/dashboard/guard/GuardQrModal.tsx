"use client";

import Image from "next/image";
import { Link2, FileDown } from "lucide-react";
import { ModalShell } from "@/components/dashboard/shared/ModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GuardQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
  qrUrl: string;
  guardGateName: string;
  handlePrintQr: () => void;
};

export default function GuardQrModal({
  isOpen,
  onClose,
  qrUrl,
  guardGateName,
  handlePrintQr,
}: GuardQrModalProps) {
  if (!isOpen) return null;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=18&data=${encodeURIComponent(qrUrl)}`;

  return (
    <ModalShell
      title="Gate check-in code"
      description="Visitors can scan this code to open the check-in form for this gate."
      onClose={onClose}
      className="max-w-md"
    >
      <div className="grid gap-6">
        <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-blue-100 bg-blue-50/40 p-6 text-center shadow-sm mt-2">
          <div className="mb-5 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
            {guardGateName}
          </div>
          
          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
            <Image src={qrImageUrl} alt="Gate check-in QR code" width={192} height={192} unoptimized className="h-48 w-48 object-contain" />
          </div>
          
          <h3 className="mt-5 text-xl font-bold text-slate-900">Visitor self check-in</h3>
          
          <div className="mt-5 w-full space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</div>
              Scan the code
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</div>
              Complete visitor details
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</div>
              Wait for guard review
            </div>
          </div>
          
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-rotating
          </div>
        </div>

        <div className="flex gap-2">
          <Input readOnly value={qrUrl} className="h-11 bg-slate-50 text-xs font-medium text-slate-500 border-slate-200 truncate" />
          <Button
            variant="outline"
            className="h-11 shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={(e) => {
              navigator.clipboard.writeText(qrUrl);
              const btn = e.currentTarget;
              const oldText = btn.innerText;
              btn.innerText = "Copied";
              setTimeout(() => { btn.innerText = oldText; }, 2000);
            }}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        <Button className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm font-bold text-base" onClick={handlePrintQr}>
          <FileDown className="h-5 w-5 mr-2" /> Download Poster
        </Button>
      </div>
    </ModalShell>
  );
}
