"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compression";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import { getAuthHeaders } from "@/lib/client-auth";
import AddVisitorForm from "@/components/dashboard/guard/add-visitor/AddVisitorForm";
import "react-phone-input-2/lib/style.css";
import type { Visitor } from "@/types/guard";
import type { VisitorVerificationMethod } from "@/lib/visitor-verification";
import { saveOfflineWalkInVisitor, enqueueSyncAction } from "@/lib/offline-db";

type CustomField = {
  id: string;
  label: string;
  active: boolean;
};

type Department = { id: string; name: string };
type Host = { id: string; name: string; department_id: string };
export interface AddVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
  requirePhoto: boolean;
  askPhone: boolean;
  askId: boolean;
  askHost?: boolean;
  askPurpose?: boolean;
  askVehicle?: boolean;
  guardGateId?: string | null;
  verificationMethod: VisitorVerificationMethod | "basic_default";
  qrPassEnabled: boolean;
  onVisitorAdded?: (visitor: Visitor) => void;
}

export default function AddVisitorModal({
  isOpen,
  onClose,
  companyId,
  requirePhoto,
  askPhone,
  askId,
  askHost = false,
  askPurpose = false,
  askVehicle = false,
  guardGateId = null,
  verificationMethod,
  qrPassEnabled,
  onVisitorAdded,
}: AddVisitorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    name: "", phone: "", id_number: "", doc_type: "National ID", host_id: "", purpose: "", vehicle_reg: ""
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);

  const [hostSearchQuery, setHostSearchQuery] = useState("");
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // NEW: Terms and Conditions State
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [planTier, setPlanTier] = useState("basic");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHostDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!companyId || !isOpen) return;
      const { data } = await supabase
        .from("companies")
        .select("name, plan_tier, custom_fields")
        .eq("id", companyId)
        .single();

      if (data) {
        setPlanTier(data.plan_tier || "basic");
        if (data.custom_fields) {
          const activeFields = (data.custom_fields as CustomField[]).filter(f => f.active);
          setCustomFields(activeFields);
        }
      }
    };

    const fetchDepartmentsAndHosts = async () => {
      if (!companyId || !isOpen) return;
      try {
        const deptsRes = await fetch(`/api/departments?company_id=${companyId}`);
        if (deptsRes.ok) {
          const deptsJson = await deptsRes.json();
          if (deptsJson.data) setDepartments(deptsJson.data);
        }

        const hostsRes = await fetch(`/api/hosts?company_id=${companyId}`);
        if (hostsRes.ok) {
          const hostsJson = await hostsRes.json();
          if (hostsJson.data) setHosts(hostsJson.data);
        }
      } catch (error) {
        console.error("Error fetching hosts/departments", error);
      }
    };

    fetchCustomFields();
    fetchDepartmentsAndHosts();
  }, [companyId, isOpen]);

  const filteredDepartments = departments.map(dept => {
    const deptHosts = hosts.filter(h =>
      h.department_id === dept.id &&
      h.name.toLowerCase().includes(hostSearchQuery.toLowerCase())
    );
    return { ...dept, hosts: deptHosts };
  }).filter(dept => dept.hosts.length > 0);

  if (!isOpen) return null;

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      alert("Could not identify your building assignment. Please refresh the page.");
      return;
    }

    if (!agreedToTerms) {
      alert("You must agree to the Terms and Conditions to register.");
      return;
    }

    if (requirePhoto && !selfieFile) {
      alert("A security photo is required by building management.");
      return;
    }

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      setIsSubmitting(true);
      try {
        let finalPhone = null;
        if (askPhone && newVisitor.phone) {
          finalPhone = newVisitor.phone.startsWith("+") ? newVisitor.phone : `+${newVisitor.phone}`;
        }

        const finalGateId = guardGateId && guardGateId !== "" && guardGateId !== "unassigned" ? guardGateId : null;
        const localId = "offline_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

        const registerPayload = {
          company_id: companyId,
          gate_id: finalGateId,
          name: newVisitor.name.trim(),
          phone: finalPhone || "",
          document_type: askId ? newVisitor.doc_type : null,
          id_number: askId ? newVisitor.id_number.trim() : null,
          host_id: askHost && newVisitor.host_id ? newVisitor.host_id : null,
          purpose: askPurpose ? newVisitor.purpose.trim() || null : null,
          vehicle_reg: askVehicle ? newVisitor.vehicle_reg.trim() || null : null,
          photo_url: selfiePreview || null,
          custom_data: { ...customAnswers, source: "guard_desk_offline" },
        };

        const offlineVisitor: Visitor = {
          id: localId,
          name: newVisitor.name.trim(),
          phone: finalPhone || "",
          status: "checked_in",
          created_at: new Date().toISOString(),
          checked_in_at: new Date().toISOString(),
          document_type: askId ? newVisitor.doc_type : "National ID",
          id_number: askId ? newVisitor.id_number.trim() : undefined,
          company_id: companyId,
          gate_id: finalGateId,
          host_id: askHost && newVisitor.host_id ? newVisitor.host_id : null,
          host_name: hosts.find((h) => h.id === newVisitor.host_id)?.name,
          purpose: askPurpose ? newVisitor.purpose.trim() : undefined,
          vehicle_reg: askVehicle ? newVisitor.vehicle_reg.trim() : undefined,
          photo_url: selfiePreview || undefined,
          custom_data: { ...customAnswers, source: "guard_desk_offline" },
        };

        await saveOfflineWalkInVisitor(offlineVisitor);
        await enqueueSyncAction("register_walk_in", localId, registerPayload);

        onVisitorAdded?.(offlineVisitor);

        // Reset form
        setNewVisitor({ name: "", phone: "", id_number: "", doc_type: "National ID", host_id: "", purpose: "", vehicle_reg: "" });
        setHostSearchQuery("");
        setCustomAnswers({});
        setSelfieFile(null);
        setSelfiePreview(null);
        setAgreedToTerms(false);
        onClose();
        return;
      } catch (err) {
        console.error("Failed to save offline visitor:", err);
        alert("Failed to record visitor offline.");
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    setIsSubmitting(true);
    let uploadedPhotoUrl = null;

    try {
      let finalPhone = null;
      if (askPhone && newVisitor.phone) {
        finalPhone = newVisitor.phone.startsWith("+") ? newVisitor.phone : `+${newVisitor.phone}`;
      }

      // 1. Upload Selfie
      if (selfieFile) {
        const compressedFile = await compressImage(selfieFile);

        const formDataPayload = new FormData();
        formDataPayload.append("file", compressedFile);
        formDataPayload.append("companyId", companyId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataPayload,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedPhotoUrl = uploadData.url;
        } else {
          throw new Error("Failed to securely upload security photo.");
        }
      }

      // 2. Register Visitor Record
      if (verificationMethod === "qr_pass" && !qrPassEnabled) {
        throw new Error("QR Pass is selected but not enabled in environment settings.");
      }

      const finalGateId = guardGateId && guardGateId !== "" && guardGateId !== "unassigned" ? guardGateId : null;

      const registerPayload = {
        company_id: companyId,
        gate_id: finalGateId,
        name: newVisitor.name.trim(),
        phone: finalPhone || "",
        document_type: askId ? newVisitor.doc_type : null,
        id_number: askId ? newVisitor.id_number.trim() : null,
        host_id: askHost && newVisitor.host_id ? newVisitor.host_id : null,
        purpose: askPurpose ? newVisitor.purpose.trim() || null : null,
        vehicle_reg: askVehicle ? newVisitor.vehicle_reg.trim() || null : null,
        photo_url: uploadedPhotoUrl,
        custom_data: { ...customAnswers, source: "guard_desk" },
      };

      const registerRes = await fetch("/api/visitors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerPayload),
      });
      const registerJson = await registerRes.json().catch(() => ({}));

      if (!registerRes.ok) {
        throw new Error(registerJson.error || "Failed to add visitor.");
      }

      const createdVisitor = registerJson.data as Visitor | undefined;
      if (createdVisitor) {
        try {
          const params = new URLSearchParams({ company_id: companyId, id: createdVisitor.id });
          const guardVisitorRes = await fetch(`/api/guard/visitors?${params.toString()}`, {
            headers: await getAuthHeaders(),
          });
          const guardVisitorJson = await guardVisitorRes.json().catch(() => ({}));
          onVisitorAdded?.((guardVisitorJson.data?.[0] as Visitor | undefined) || createdVisitor);
        } catch {
          onVisitorAdded?.(createdVisitor);
        }
      }

      if (askHost && newVisitor.host_id && planTier !== "basic" && createdVisitor?.id && companyId) {
        try {
          await fetch("/api/notify-host", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitorId: createdVisitor.id,
              companyId,
            }),
          });
        } catch (notifyError) {
          console.error("Failed to trigger host notification:", notifyError);
        }
      }

      // Reset form
      setNewVisitor({ name: "", phone: "", id_number: "", doc_type: "National ID", host_id: "", purpose: "", vehicle_reg: "" });
      setHostSearchQuery("");
      setCustomAnswers({});
      setSelfieFile(null);
      setSelfiePreview(null);
      setAgreedToTerms(false);
      onClose();

    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Fallback to offline save
        try {
          const localId = "offline_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
          const finalGateId = guardGateId && guardGateId !== "" && guardGateId !== "unassigned" ? guardGateId : null;
          let finalPhone = null;
          if (askPhone && newVisitor.phone) {
            finalPhone = newVisitor.phone.startsWith("+") ? newVisitor.phone : `+${newVisitor.phone}`;
          }
          const offlineVisitor: Visitor = {
            id: localId,
            name: newVisitor.name.trim(),
            phone: finalPhone || "",
            status: "checked_in",
            created_at: new Date().toISOString(),
            checked_in_at: new Date().toISOString(),
            document_type: askId ? newVisitor.doc_type : "National ID",
            id_number: askId ? newVisitor.id_number.trim() : undefined,
            company_id: companyId,
            gate_id: finalGateId,
            host_id: askHost && newVisitor.host_id ? newVisitor.host_id : null,
            host_name: hosts.find((h) => h.id === newVisitor.host_id)?.name,
            purpose: askPurpose ? newVisitor.purpose.trim() : undefined,
            vehicle_reg: askVehicle ? newVisitor.vehicle_reg.trim() : undefined,
            photo_url: selfiePreview || undefined,
            custom_data: { ...customAnswers, source: "guard_desk_offline" },
          };
          await saveOfflineWalkInVisitor(offlineVisitor);
          await enqueueSyncAction("register_walk_in", localId, {
            company_id: companyId,
            gate_id: finalGateId,
            name: newVisitor.name.trim(),
            phone: finalPhone || "",
            document_type: askId ? newVisitor.doc_type : null,
            id_number: askId ? newVisitor.id_number.trim() : null,
            host_id: askHost && newVisitor.host_id ? newVisitor.host_id : null,
            purpose: askPurpose ? newVisitor.purpose.trim() || null : null,
            vehicle_reg: askVehicle ? newVisitor.vehicle_reg.trim() || null : null,
            photo_url: selfiePreview || null,
            custom_data: { ...customAnswers, source: "guard_desk_offline" },
          });
          onVisitorAdded?.(offlineVisitor);
          setNewVisitor({ name: "", phone: "", id_number: "", doc_type: "National ID", host_id: "", purpose: "", vehicle_reg: "" });
          setHostSearchQuery("");
          setCustomAnswers({});
          setSelfieFile(null);
          setSelfiePreview(null);
          setAgreedToTerms(false);
          onClose();
          return;
        } catch (saveErr) {
          console.error("Fallback offline save error:", saveErr);
        }
      }

      const message = getSupabaseErrorMessage(err, "Failed to add visitor.");
      console.error("Failed to add visitor:", err);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AddVisitorForm
      askPhone={askPhone}
      askId={askId}
      askHost={askHost}
      askPurpose={askPurpose}
      askVehicle={askVehicle}
      requirePhoto={requirePhoto}
      isSubmitting={isSubmitting}
      newVisitor={newVisitor}
      customFields={customFields}
      customAnswers={customAnswers}
      hostSearchQuery={hostSearchQuery}
      isHostDropdownOpen={isHostDropdownOpen}
      filteredDepartments={filteredDepartments}
      selfiePreview={selfiePreview}
      agreedToTerms={agreedToTerms}
      selfieInputRef={selfieInputRef}
      dropdownRef={dropdownRef}
      onClose={onClose}
      onSubmit={handleAddVisitor}
      onNewVisitorChange={setNewVisitor}
      onCustomAnswersChange={setCustomAnswers}
      onHostSearchQueryChange={setHostSearchQuery}
      onHostDropdownOpenChange={setIsHostDropdownOpen}
      onSelfieFileChange={setSelfieFile}
      onSelfiePreviewChange={setSelfiePreview}
      onAgreedToTermsChange={setAgreedToTerms}
    />
  );
}
