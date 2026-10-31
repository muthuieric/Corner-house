"use client";

import { ModalShell } from "@/components/dashboard/shared/ModalShell";
import { canUseHostConfirmation, getHostReviewLabel } from "@/lib/visitor-display";

type Visitor = {
  id: string;
  name: string;
  document_type?: string;
  id_number?: string;
  host_name?: string;
  host_confirmed?: boolean;
  purpose?: string;
  vehicle_reg?: string;
  custom_data?: Record<string, string>;
};

type VisitInfoModalProps = {
  visitor: Visitor | null;
  onClose: () => void;
  customFieldLabels: Record<string, string>;
  planTier: string;
};

export default function VisitInfoModal({
  visitor,
  onClose,
  customFieldLabels,
  planTier,
}: VisitInfoModalProps) {
  if (!visitor) return null;

  const showHostReview = Boolean(
    visitor.host_name && canUseHostConfirmation(planTier)
  );

  return (
    <ModalShell
      title="Visit Details"
      description={`Extra information provided by ${visitor.name}.`}
      onClose={onClose}
      className="max-w-sm"
    >
      <div className="mt-2 space-y-5 rounded-[1.4rem] border border-slate-100 bg-slate-50/50 p-5">
        {(visitor.document_type || visitor.id_number) && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              ID / Document
            </p>
            <p className="break-words text-lg font-bold leading-snug text-slate-900">
              {visitor.document_type || "Document"} - {visitor.id_number || "N/A"}
            </p>
          </div>
        )}

        {visitor.host_name && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Host Name
            </p>
            <p className="break-words text-lg font-bold leading-snug text-slate-900">
              {visitor.host_name}
            </p>
          </div>
        )}

        {showHostReview && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Host review
            </p>

            {visitor.host_confirmed ? (
              <div className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {getHostReviewLabel(visitor.host_confirmed)}
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                {getHostReviewLabel(visitor.host_confirmed)}
              </div>
            )}
          </div>
        )}

        {visitor.purpose && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Purpose of Visit
            </p>
            <p className="break-words text-lg font-bold leading-snug text-slate-900">
              {visitor.purpose}
            </p>
          </div>
        )}

        {visitor.vehicle_reg && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Vehicle Registration
            </p>
            <p className="break-words font-mono text-lg font-bold uppercase leading-snug text-slate-900">
              {visitor.vehicle_reg}
            </p>
          </div>
        )}

        {visitor.custom_data &&
          Object.entries(visitor.custom_data).map(([fieldId, value]) => {
            if (!value?.trim()) return null;

            const label = customFieldLabels[fieldId] || "Custom Field";

            return (
              <div key={fieldId}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="break-words text-lg font-bold leading-snug text-slate-900">
                  {value}
                </p>
              </div>
            );
          })}
      </div>
    </ModalShell>
  );
}