"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";

import { ModalShell } from "@/components/dashboard/shared/ModalShell";
import { SearchInput } from "@/components/dashboard/shared/Fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAuthHeaders } from "@/lib/client-auth";
import type { Visitor } from "@/types/guard";

type IncidentType =
  | "visitor_related"
  | "gate_issue"
  | "restricted_attempt"
  | "suspicious_activity"
  | "property_issue"
  | "emergency"
  | "other";

type Urgency = "low" | "normal" | "high" | "critical";

type GuardAccessNoteModalProps = {
  open: boolean;
  visitors: Visitor[];
  gateId?: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

const incidentTypeOptions: { value: IncidentType; label: string }[] = [
  { value: "visitor_related", label: "Visitor related" },
  { value: "gate_issue", label: "Entry point issue" },
  { value: "restricted_attempt", label: "Restricted attempt" },
  { value: "suspicious_activity", label: "Suspicious activity" },
  { value: "property_issue", label: "Property issue" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

const urgencyOptions: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function visitorSearchText(visitor: Visitor) {
  return [visitor.name, visitor.phone, visitor.id_number].filter(Boolean).join(" ").toLowerCase();
}

function visitorOptionLabel(visitor: Visitor) {
  const details = [visitor.phone, visitor.id_number].filter(Boolean).join(" / ");
  return details ? `${visitor.name} - ${details}` : visitor.name;
}

export default function GuardAccessNoteModal({
  open,
  visitors,
  gateId,
  onClose,
  onSaved,
}: GuardAccessNoteModalProps) {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [visitorQuery, setVisitorQuery] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("visitor_related");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedVisitorId(null);
    setVisitorQuery("");
    setIncidentType("visitor_related");
    setUrgency("normal");
    setDescription("");
    setActionTaken("");
    setError(null);
  }, [open]);

  const selectedVisitor = useMemo(
    () => visitors.find((visitor) => visitor.id === selectedVisitorId) || null,
    [selectedVisitorId, visitors]
  );

  const matchingVisitors = useMemo(() => {
    const query = visitorQuery.trim().toLowerCase();
    if (!query || selectedVisitor) return [];

    return visitors
      .filter((visitor) => visitorSearchText(visitor).includes(query))
      .slice(0, 6);
  }, [selectedVisitor, visitorQuery, visitors]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 5) {
      setError("Please describe what happened.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/incident-reports", {
        method: "POST",
        headers: await getAuthHeaders(true),
        body: JSON.stringify({
          visitor_id: selectedVisitor?.id || null,
          gate_id: selectedVisitor ? selectedVisitor.gate_id || gateId || null : gateId || null,
          incident_type: incidentType,
          urgency,
          description: trimmedDescription,
          action_taken: actionTaken.trim() || null,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Incident report could not be saved.");
      }

      await onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Incident report could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Report Incident"
      description="Record an incident for admin review. Visitor selection is optional."
      onClose={isSubmitting ? () => undefined : onClose}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="h-11 rounded-xl font-bold">
            Cancel
          </Button>
          <Button type="submit" form="guard-incident-report-form" disabled={isSubmitting} className="h-11 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="guard-incident-report-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="incident-visitor" className="font-bold text-slate-700">
            Visitor
          </Label>
          <SearchInput
            id="incident-visitor"
            value={selectedVisitor ? visitorOptionLabel(selectedVisitor) : visitorQuery}
            onChange={(event) => {
              setSelectedVisitorId(null);
              setVisitorQuery(event.target.value);
            }}
            inputClassName="h-11 bg-slate-50 border-slate-200"
            disabled={isSubmitting}
            placeholder="Search visitor name, phone, or ID number..."
            autoComplete="off"
          />
          {selectedVisitor ? (
            <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-black text-blue-950">{selectedVisitor.name}</p>
                <p className="mt-0.5 break-words text-xs font-semibold text-blue-800">
                  {[selectedVisitor.phone, selectedVisitor.id_number].filter(Boolean).join(" / ") || "No phone or ID recorded"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedVisitorId(null);
                  setVisitorQuery("");
                }}
                disabled={isSubmitting}
                className="border-blue-200 bg-white text-blue-700 hover:bg-blue-100"
              >
                Clear
              </Button>
            </div>
          ) : matchingVisitors.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {matchingVisitors.map((visitor) => (
                <button
                  key={visitor.id}
                  type="button"
                  onClick={() => {
                    setSelectedVisitorId(visitor.id);
                    setVisitorQuery("");
                  }}
                  disabled={isSubmitting}
                  className="flex w-full flex-col gap-0.5 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="break-words text-sm font-bold text-slate-900">{visitor.name}</span>
                  <span className="break-words text-xs font-semibold text-slate-500">
                    {[visitor.phone, visitor.id_number, visitor.status?.replace("_", " ")].filter(Boolean).join(" / ")}
                  </span>
                </button>
              ))}
            </div>
          ) : visitorQuery.trim() ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              No matching visitor. Leave this blank to submit a general gate report.
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-500">
              Optional. Leave blank for a general gate report.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="incident-type" className="font-bold text-slate-700">
              Report type
            </Label>
            <select
              id="incident-type"
              value={incidentType}
              onChange={(event) => setIncidentType(event.target.value as IncidentType)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-600"
              disabled={isSubmitting}
            >
              {incidentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident-urgency" className="font-bold text-slate-700">
              Priority
            </Label>
            <select
              id="incident-urgency"
              value={urgency}
              onChange={(event) => setUrgency(event.target.value as Urgency)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-600"
              disabled={isSubmitting}
            >
              {urgencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="incident-description" className="font-bold text-slate-700">
            Description
          </Label>
          <textarea
            id="incident-description"
            required
            minLength={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
            className="min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600"
            placeholder="Describe what happened..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="incident-action" className="font-bold text-slate-700">
            Action taken
          </Label>
          <textarea
            id="incident-action"
            value={actionTaken}
            onChange={(event) => setActionTaken(event.target.value)}
            disabled={isSubmitting}
            className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600"
            placeholder="Optional actions already taken..."
          />
        </div>

        {error && (
          <div className="flex gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
