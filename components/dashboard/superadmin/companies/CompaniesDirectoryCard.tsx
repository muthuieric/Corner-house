"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle,
  Eye,
  Lock,
  Mail,
  MapPin,
  Phone,
  Unlock,
  User,
  UserPlus,
} from "lucide-react";

import { DataTableShell } from "@/components/dashboard/shared/DataTableShell";
import { SearchInput } from "@/components/dashboard/shared/Fields";
import { EmptyState, LoadingState } from "@/components/dashboard/shared/StateBlocks";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { WorkspaceLogo } from "@/components/dashboard/shared/WorkspaceLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Company = {
  id: string;
  name: string;
  address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  subscription_status: string;
  is_locked: boolean;
  hard_locked?: boolean;
  hard_lock_reason?: string | null;
  hard_locked_at?: string | null;
  plan_tier?: string;
  current_balance?: number | null;
  logo_url?: string | null;
};

type CompaniesDirectoryCardProps = {
  companies: Company[];
  filteredCompanies: Company[];
  loading: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onOpenAdminModal: (companyId: string) => void;
  onViewCompanyVisitors: (companyId: string, companyName: string, logoUrl?: string | null) => void;
  onToggleCompanyLock: (companyId: string, currentLockStatus: boolean) => void;
  onToggleCompanyHardLock: (companyId: string, currentHardLockStatus: boolean) => void;
  onApproveCompany: (companyId: string) => void;
  onChangePlanTier: (companyId: string, newTier: string) => void;
};

function workspaceStatus(company: Company) {
  if (company.hard_locked || company.is_locked) return "locked";
  if (company.subscription_status === "trial" || company.plan_tier === "trial_basic" || company.plan_tier === "trial_premium") return "trial";
  if (Number(company.current_balance || 0) > 0) return "unpaid";
  return "paid";
}

function WorkspaceStatusBadge({ company }: { company: Company }) {
  const status = workspaceStatus(company);
  const label = status === "locked" ? "Hard Locked" : status === "trial" ? "Trial" : status === "unpaid" ? "Unpaid" : "Paid";

  return <StatusBadge status={status}>{label}</StatusBadge>;
}

export default function CompaniesDirectoryCard({
  companies,
  filteredCompanies,
  loading,
  searchTerm,
  onSearchTermChange,
  onOpenAdminModal,
  onViewCompanyVisitors,
  onToggleCompanyLock,
  onToggleCompanyHardLock,
  onApproveCompany,
  onChangePlanTier,
}: CompaniesDirectoryCardProps) {
  return (
    <DataTableShell
      title="Workspaces List"
      description="Search, review, and manage every workspace on the platform."
      filters={
        <div className="w-full md:w-96">
          <SearchInput
            placeholder="Search workspace or email..."
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>
      }
    >
      {loading ? (
        <div className="p-5">
          <LoadingState label="Loading workspaces..." />
        </div>
      ) : companies.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No workspaces found" description="Create your first workspace to begin onboarding clients." />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No matching workspaces" description="Try adjusting your search query." />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">Workspace</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <WorkspaceLogo name={company.name} logoUrl={company.logo_url} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <span className="max-w-[220px] truncate">{company.name}</span>
                            {company.hard_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                            {company.is_locked && !company.hard_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                          </div>
                          {(company.is_locked || company.hard_locked) && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {company.is_locked && <Badge variant="pending">Soft locked</Badge>}
                              {company.hard_locked && <Badge variant="error">Hard locked</Badge>}
                            </div>
                          )}
                          <div className="mt-0.5 flex max-w-[240px] items-center gap-1 truncate text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {company.address || "No address provided"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {company.contact_name || "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {company.contact_email || "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {company.contact_phone || "N/A"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={company.plan_tier || "basic"}
                        onValueChange={(newValue) => onChangePlanTier(company.id, newValue)}
                      >
                        <SelectTrigger className="min-h-8 w-32 py-1 text-xs uppercase tracking-wider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="trial_basic">Trial (Basic)</SelectItem>
                          <SelectItem value="trial_premium">Trial (Premium)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <WorkspaceStatusBadge company={company} />
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {new Date(company.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>

                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-2">
                        {company.subscription_status === "pending_approval" ? (
                          <Button size="sm" onClick={() => onApproveCompany(company.id)}>
                            <CheckCircle className="h-4 w-4" /> Approve
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => onOpenAdminModal(company.id)}>
                              <UserPlus className="h-4 w-4" /> Admin
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onViewCompanyVisitors(company.id, company.name, company.logo_url)}>
                              <Eye className="h-4 w-4" /> Data
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={
                                company.is_locked
                                  ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                                  : "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                              }
                              onClick={() => onToggleCompanyLock(company.id, company.is_locked)}
                            >
                              {company.is_locked ? <><Unlock className="h-4 w-4" /> Remove Soft Lock</> : <><Lock className="h-4 w-4" /> Soft Lock</>}
                            </Button>
                            <Button
                              size="sm"
                              variant={company.hard_locked ? "outline" : "destructive"}
                              className={company.hard_locked ? "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" : undefined}
                              onClick={() => onToggleCompanyHardLock(company.id, company.hard_locked || false)}
                            >
                              {company.hard_locked ? <><Unlock className="h-4 w-4" /> Remove Hard Lock</> : <><Lock className="h-4 w-4" /> Hard Lock</>}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <WorkspaceLogo name={company.name} logoUrl={company.logo_url} size="sm" />
                      <span className="truncate">{company.name}</span>
                      {company.hard_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                      {company.is_locked && !company.hard_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                    </div>
                    {(company.is_locked || company.hard_locked) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {company.is_locked && <Badge variant="pending">Soft locked</Badge>}
                        {company.hard_locked && <Badge variant="error">Hard locked</Badge>}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{company.address || "No address provided"}</span>
                    </div>
                  </div>
                  <WorkspaceStatusBadge company={company} />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {company.contact_name || "N/A"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {company.contact_email || "N/A"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {company.contact_phone || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(company.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <Select
                    value={company.plan_tier || "basic"}
                    onValueChange={(newValue) => onChangePlanTier(company.id, newValue)}
                  >
                    <SelectTrigger className="min-h-8 py-1 text-xs uppercase tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="trial_basic">Trial (Basic)</SelectItem>
                      <SelectItem value="trial_premium">Trial (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {company.subscription_status === "pending_approval" ? (
                    <Button size="sm" className="w-full" onClick={() => onApproveCompany(company.id)}>
                      <CheckCircle className="h-4 w-4" /> Approve & Start Trial
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpenAdminModal(company.id)}>
                        <UserPlus className="h-4 w-4" /> Admin
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewCompanyVisitors(company.id, company.name, company.logo_url)}>
                        <Eye className="h-4 w-4" /> Data
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          company.is_locked
                            ? "w-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                            : "w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        }
                        onClick={() => onToggleCompanyLock(company.id, company.is_locked)}
                      >
                        {company.is_locked ? <><Unlock className="h-4 w-4" /> Remove Soft Lock</> : <><Lock className="h-4 w-4" /> Soft Lock</>}
                      </Button>
                      <Button
                        size="sm"
                        variant={company.hard_locked ? "outline" : "destructive"}
                        className={company.hard_locked ? "w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" : "w-full"}
                        onClick={() => onToggleCompanyHardLock(company.id, company.hard_locked || false)}
                      >
                        {company.hard_locked ? <><Unlock className="h-4 w-4" /> Remove Hard Lock</> : <><Lock className="h-4 w-4" /> Hard Lock</>}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </DataTableShell>
  );
}
