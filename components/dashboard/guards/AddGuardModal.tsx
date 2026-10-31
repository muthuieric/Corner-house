"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type Gate = {
  id: string;
  name: string;
};

type NewGuard = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gateId: string;
};

type AddGuardModalProps = {
  gates: Gate[];
  newGuard: NewGuard;
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onNewGuardChange: (guard: NewGuard) => void;
};

export default function AddGuardModal({
  gates,
  newGuard,
  isSubmitting,
  error,
  onClose,
  onSubmit,
  onNewGuardChange,
}: AddGuardModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center overflow-y-auto p-4">
      <Card className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-hidden rounded-[1.4rem] border-slate-100 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 pb-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add guard dialog"
            className="ml-auto text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <CardHeader className="pt-2 pb-4 px-6 text-center">
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Add Guard</CardTitle>
          <CardDescription className="text-slate-500 font-medium">They will use these credentials to log into the gate tablet.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 pb-0">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="add-guard-name" className="font-bold text-slate-700">Full Name</Label>
              <Input
                id="add-guard-name"
                required
                placeholder="e.g. David Ochieng"
                value={newGuard.name}
                onChange={(e) => onNewGuardChange({ ...newGuard, name: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-guard-email" className="font-bold text-slate-700">Email Address</Label>
              <Input
                id="add-guard-email"
                required
                type="email"
                placeholder="david@building.com"
                value={newGuard.email}
                onChange={(e) => onNewGuardChange({ ...newGuard, email: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-guard-gate" className="font-bold text-slate-700">Assign to entry point</Label>
              <select
                id="add-guard-gate"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
                value={newGuard.gateId}
                onChange={(e) => onNewGuardChange({ ...newGuard, gateId: e.target.value })}
              >
                <option value="">Unassigned (can access all)</option>
                {gates.map((gate) => (
                  <option key={gate.id} value={gate.id}>
                    {gate.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Select which entry point this guard will manage.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-guard-password" className="font-bold text-slate-700">Password</Label>
              <PasswordInput
                id="add-guard-password"
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                minLength={8}
                value={newGuard.password}
                onChange={(e) => onNewGuardChange({ ...newGuard, password: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-guard-confirm-password" className="font-bold text-slate-700">Confirm Password</Label>
              <PasswordInput
                id="add-guard-confirm-password"
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                minLength={8}
                value={newGuard.confirmPassword}
                onChange={(e) => onNewGuardChange({ ...newGuard, confirmPassword: e.target.value })}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "add-guard-error" : undefined}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>

            {error && (
              <p id="add-guard-error" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6 font-bold text-slate-500 hover:text-slate-900 rounded-xl" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-transform active:scale-[0.98]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  "Add Guard"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
