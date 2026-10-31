"use client";

import { Factory, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { Button } from "@/components/ui/button";

type SuperadminCompaniesHeaderProps = {
  onNewCompany: () => void;
};

export default function SuperadminCompaniesHeader({ onNewCompany }: SuperadminCompaniesHeaderProps) {
  return (
    <PageHeader
      title="Workspaces"
      eyebrow="Platform directory"
      description="Manage workspaces, plans, workspace admins, approvals, and access states."
      icon={Factory}
    >
      <Button onClick={onNewCompany} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" /> New Workspace
      </Button>
    </PageHeader>
  );
}
