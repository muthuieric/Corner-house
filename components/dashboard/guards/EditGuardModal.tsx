"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Gate = {
  id: string;
  name: string;
};

type EditingGuardData = {
  id: string;
  name: string;
  gateId: string;
};

type EditGuardModalProps = {
  gates: Gate[];
  editingGuardData: EditingGuardData;
  isEditingGuard: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onEditingGuardDataChange: (guard: EditingGuardData) => void;
};

export default function EditGuardModal({
  gates,
  editingGuardData,
  isEditingGuard,
  onClose,
  onSubmit,
  onEditingGuardDataChange,
}: EditGuardModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center overflow-y-auto p-4">
      <Card className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-hidden rounded-[1.4rem] border-slate-100 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 pb-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit guard dialog"
            className="ml-auto text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <CardHeader className="pt-2 pb-4 px-6 text-center">
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Edit Guard</CardTitle>
          <CardDescription className="text-slate-500 font-medium">Update the guard&apos;s name or assigned gate location.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 pb-0">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-guard-name" className="font-bold text-slate-700">Full Name</Label>
              <Input
                id="edit-guard-name"
                required
                value={editingGuardData.name}
                onChange={(e) => onEditingGuardDataChange({ ...editingGuardData, name: e.target.value })}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-guard-gate" className="font-bold text-slate-700">Assigned entry point</Label>
              <select
                id="edit-guard-gate"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
                value={editingGuardData.gateId}
                onChange={(e) => onEditingGuardDataChange({ ...editingGuardData, gateId: e.target.value })}
              >
                <option value="">Unassigned (can access all)</option>
                {gates.map((gate) => (
                  <option key={gate.id} value={gate.id}>
                    {gate.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6 font-bold text-slate-500 hover:text-slate-900 rounded-xl" disabled={isEditingGuard}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-transform active:scale-[0.98]" disabled={isEditingGuard}>
                {isEditingGuard ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
