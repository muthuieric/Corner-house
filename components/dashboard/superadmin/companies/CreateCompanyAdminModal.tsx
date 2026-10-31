"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/dashboard/shared/Fields";
import { ModalShell } from "@/components/dashboard/shared/ModalShell";

type AdminForm = {
  fullName: string;
  email: string;
  password: string;
};

type CreateCompanyAdminModalProps = {
  adminForm: AdminForm;
  isCreatingAdmin: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onAdminFormChange: (form: AdminForm) => void;
};

export default function CreateCompanyAdminModal({
  adminForm,
  isCreatingAdmin,
  onClose,
  onSubmit,
  onAdminFormChange,
}: CreateCompanyAdminModalProps) {
  return (
    <ModalShell
      title="Create Workspace Admin"
      description="Generate credentials for the building manager."
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="workspace-admin-form" disabled={isCreatingAdmin}>
            {isCreatingAdmin ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Admin Account"}
          </Button>
        </div>
      }
    >
      <form id="workspace-admin-form" onSubmit={onSubmit} className="space-y-5">
        <FormField label="Admin Full Name">
          <Input
            required
            placeholder="e.g. Jane Doe"
            value={adminForm.fullName}
            onChange={(e) => onAdminFormChange({ ...adminForm, fullName: e.target.value })}
          />
        </FormField>
        <FormField label="Email Address">
          <Input
            required
            type="email"
            placeholder="manager@building.com"
            value={adminForm.email}
            onChange={(e) => onAdminFormChange({ ...adminForm, email: e.target.value })}
          />
        </FormField>
        <FormField label="Initial Password">
          <PasswordInput
            required
            placeholder="Min 8 chars, 1 uppercase, 1 symbol"
            minLength={8}
            value={adminForm.password}
            onChange={(e) => onAdminFormChange({ ...adminForm, password: e.target.value })}
          />
        </FormField>
      </form>
    </ModalShell>
  );
}
