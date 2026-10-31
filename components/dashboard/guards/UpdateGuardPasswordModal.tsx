"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import type { GuardPasswordData } from "@/hooks/useCompanyAdminGuards";

type UpdateGuardPasswordModalProps = {
  passwordData: GuardPasswordData;
  isUpdatingPassword: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onPasswordDataChange: (data: GuardPasswordData) => void;
};

export default function UpdateGuardPasswordModal({
  passwordData,
  isUpdatingPassword,
  error,
  onClose,
  onSubmit,
  onPasswordDataChange,
}: UpdateGuardPasswordModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center overflow-y-auto p-4">
      <Card className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-hidden rounded-[1.4rem] border-slate-100 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 pb-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close update guard password dialog"
            className="ml-auto text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <CardHeader className="pt-2 pb-4 px-6 text-center">
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Update guard password</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Set a new login password for this guard account.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 pb-0">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="update-guard-password" className="font-bold text-slate-700">New password</Label>
              <PasswordInput
                id="update-guard-password"
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                minLength={8}
                value={passwordData.password}
                onChange={(event) => onPasswordDataChange({ ...passwordData, password: event.target.value })}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "update-guard-password-error" : undefined}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="update-guard-confirm-password" className="font-bold text-slate-700">Confirm new password</Label>
              <PasswordInput
                id="update-guard-confirm-password"
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                minLength={8}
                value={passwordData.confirmPassword}
                onChange={(event) => onPasswordDataChange({ ...passwordData, confirmPassword: event.target.value })}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "update-guard-password-error" : undefined}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>

            {error && (
              <p id="update-guard-password-error" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6 font-bold text-slate-500 hover:text-slate-900 rounded-xl" disabled={isUpdatingPassword}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-transform active:scale-[0.98]" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
