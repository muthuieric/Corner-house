"use client";

import Image from "next/image";
import PhoneInput from "react-phone-input-2";
import { ModalShell } from "@/components/dashboard/shared/ModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CustomField = {
  id: string;
  label: string;
  active: boolean;
};

type Host = { id: string; name: string; department_id: string };
type DepartmentWithHosts = { id: string; name: string; hosts: Host[] };

type VisitorFormData = {
  name: string;
  phone: string;
  id_number: string;
  doc_type: string;
  host_id: string;
  purpose: string;
  vehicle_reg: string;
};

type AddVisitorFormProps = {
  askPhone: boolean;
  askId: boolean;
  askHost: boolean;
  askPurpose: boolean;
  askVehicle: boolean;
  requirePhoto: boolean;
  isSubmitting: boolean;
  newVisitor: VisitorFormData;
  customFields: CustomField[];
  customAnswers: Record<string, string>;
  hostSearchQuery: string;
  isHostDropdownOpen: boolean;
  filteredDepartments: DepartmentWithHosts[];
  selfiePreview: string | null;
  agreedToTerms: boolean;
  selfieInputRef: React.RefObject<HTMLInputElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onNewVisitorChange: (visitor: VisitorFormData) => void;
  onCustomAnswersChange: (answers: Record<string, string>) => void;
  onHostSearchQueryChange: (value: string) => void;
  onHostDropdownOpenChange: (value: boolean) => void;
  onSelfieFileChange: (file: File) => void;
  onSelfiePreviewChange: (preview: string) => void;
  onAgreedToTermsChange: (value: boolean) => void;
};

export default function AddVisitorForm({
  askPhone,
  askId,
  askHost,
  askPurpose,
  askVehicle,
  requirePhoto,
  isSubmitting,
  newVisitor,
  customFields,
  customAnswers,
  hostSearchQuery,
  isHostDropdownOpen,
  filteredDepartments,
  selfiePreview,
  agreedToTerms,
  selfieInputRef,
  dropdownRef,
  onClose,
  onSubmit,
  onNewVisitorChange,
  onCustomAnswersChange,
  onHostSearchQueryChange,
  onHostDropdownOpenChange,
  onSelfieFileChange,
  onSelfiePreviewChange,
  onAgreedToTermsChange,
}: AddVisitorFormProps) {
  return (
    <ModalShell
      title="New visitor"
      description="Add a guest from the security desk."
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="sm:w-auto w-full font-bold h-11 border border-slate-200">
            Cancel
          </Button>
          <Button type="submit" form="add-visitor-form" className="h-11 sm:w-auto w-full bg-blue-600 text-base font-bold text-white hover:bg-blue-700 shadow-sm" disabled={isSubmitting || !agreedToTerms}>
            {isSubmitting ? "Adding Guest..." : "Add Visitor"}
          </Button>
        </div>
      }
    >
      <form id="add-visitor-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* Visitor details section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Visitor details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="guard-visitor-name" className="font-bold text-slate-800">Full Name <span className="text-red-500">*</span></Label>
              <Input id="guard-visitor-name" required value={newVisitor.name} onChange={(e) => onNewVisitorChange({ ...newVisitor, name: e.target.value })} placeholder="e.g. John Doe" className="h-12 bg-white" />
            </div>

            {askPhone && (
              <div className="space-y-2">
                <Label htmlFor="guard-visitor-phone" className="font-bold text-slate-800">Phone Number</Label>
                <PhoneInput
                  inputProps={{ id: "guard-visitor-phone" }}
                  country="ke"
                  value={newVisitor.phone}
                  onChange={phone => onNewVisitorChange({ ...newVisitor, phone })}
                  inputClass="!w-full !h-12 !text-slate-950 !bg-white !rounded-xl !border !border-slate-200 focus:!ring-2 focus:!ring-blue-600 px-3"
                  containerClass="w-full"
                  buttonClass="!border-slate-200 !bg-slate-50 !rounded-l-xl hover:!bg-slate-100"
                />
              </div>
            )}

            {askId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guard-doc-type" className="font-bold text-slate-800">Document Type</Label>
                  <select
                    id="guard-doc-type"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newVisitor.doc_type}
                    onChange={(e) => onNewVisitorChange({ ...newVisitor, doc_type: e.target.value })}
                  >
                    <option value="National ID">National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver's License">Driver&apos;s License</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guard-id-number" className="font-bold text-slate-800">ID / Document No.</Label>
                  <Input
                    id="guard-id-number"
                    value={newVisitor.id_number}
                    onChange={(e) => onNewVisitorChange({ ...newVisitor, id_number: e.target.value })}
                    placeholder="Enter ID number"
                    className="h-12 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Visit details section */}
        {(askHost || askPurpose || askVehicle || customFields.length > 0) && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Visit details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {askHost && (
                <div className="relative space-y-2 md:col-span-2" ref={dropdownRef}>
                  <Label htmlFor="guard-host-search" className="font-bold text-slate-800">Who are you visiting?</Label>
                  <Input
                    id="guard-host-search"
                    type="text"
                    placeholder="Type to search for a host..."
                    value={hostSearchQuery}
                    onChange={(e) => {
                      onHostSearchQueryChange(e.target.value);
                      onHostDropdownOpenChange(true);
                      onNewVisitorChange({ ...newVisitor, host_id: "" });
                    }}
                    onFocus={() => onHostDropdownOpenChange(true)}
                    className="h-12 bg-white"
                    autoComplete="off"
                  />

                  <input type="text" className="hidden" value={newVisitor.host_id} onChange={() => {}} />

                  {isHostDropdownOpen && (
                    <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {filteredDepartments.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No matching hosts found.</div>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <div key={dept.id}>
                            <div className="sticky top-0 flex items-center gap-2 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                              {dept.name}
                            </div>
                            {dept.hosts.map((host) => (
                              <button
                                type="button"
                                key={host.id}
                                className="block w-full cursor-pointer border-b border-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-blue-50 last:border-0"
                                onClick={() => {
                                  onNewVisitorChange({ ...newVisitor, host_id: host.id });
                                  onHostSearchQueryChange(host.name);
                                  onHostDropdownOpenChange(false);
                                }}
                              >
                                {host.name}
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {askPurpose && (
                <div className="space-y-2">
                  <Label htmlFor="guard-purpose" className="font-bold text-slate-800">Purpose of Visit</Label>
                  <Input
                    id="guard-purpose"
                    value={newVisitor.purpose}
                    onChange={(e) => onNewVisitorChange({ ...newVisitor, purpose: e.target.value })}
                    placeholder="e.g. Meeting, Delivery, Interview"
                    className="h-12 bg-white"
                  />
                </div>
              )}

              {askVehicle && (
                <div className="space-y-2">
                  <Label htmlFor="guard-vehicle" className="font-bold text-slate-800">Vehicle Registration</Label>
                  <Input
                    id="guard-vehicle"
                    value={newVisitor.vehicle_reg}
                    onChange={(e) => onNewVisitorChange({ ...newVisitor, vehicle_reg: e.target.value })}
                    placeholder="e.g. KCA 123A (Leave blank if walk-in)"
                    className="h-12 bg-white uppercase"
                  />
                </div>
              )}

              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`guard-custom-${field.id}`} className="font-bold text-slate-800">{field.label}</Label>
                  <Input
                    id={`guard-custom-${field.id}`}
                    value={customAnswers[field.id] || ""}
                    onChange={(e) => onCustomAnswersChange({ ...customAnswers, [field.id]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="h-12 bg-white"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo verification */}
        {requirePhoto && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo verification</h3>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold tracking-wider uppercase text-red-600">Required</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white">
                {selfiePreview ? (
                  <Image
                    src={selfiePreview}
                    alt="Selfie preview"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">No Photo</span>
                )}
              </div>

              <div className="flex-1">
                <input
                  id="guard-selfie"
                  aria-label="Security photo"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  ref={selfieInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onSelfieFileChange(file);
                      onSelfiePreviewChange(URL.createObjectURL(file));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full bg-white text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => selfieInputRef.current?.click()}
                >
                  Capture Photo
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Entry confirmation */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Entry confirmation</h3>
            <p className="mt-1 text-sm text-slate-500">Review the notice before adding this visitor to the queue.</p>
          </div>
          
          <div className="rounded-[1.4rem] border border-blue-100 bg-blue-50/30 p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Queue update</p>
                <p className="text-sm text-slate-600 mt-0.5">This guest will appear in the current visitor queue.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Entry notice</p>
                <p className="text-sm text-slate-600 mt-0.5">The visitor has been informed of the building entry rules.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Data use</p>
                <p className="text-sm text-slate-600 mt-0.5">Their details will be stored for visitor records and security review.</p>
              </div>
            </div>
          </div>

          <label
            htmlFor="terms"
            className="flex cursor-pointer items-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <input
              type="checkbox"
              id="terms"
              required
              checked={agreedToTerms}
              onChange={(e) => onAgreedToTermsChange(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <span className="text-sm font-bold leading-snug text-slate-800">
              I confirm the visitor has agreed to the entry notice and data-use terms. <span className="text-red-500">*</span>
            </span>
          </label>
        </section>
      </form>
    </ModalShell>
  );
}
