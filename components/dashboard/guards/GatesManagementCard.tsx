"use client";

import { DoorOpen, Loader2, Pencil, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/StateBlocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Gate = {
  id: string;
  name: string;
};

type GatesManagementCardProps = {
  gates: Gate[];
  newGateName: string;
  isCreatingGate: boolean;
  editingGateId: string | null;
  editingGateName: string;
  isUpdatingGate: boolean;
  onNewGateNameChange: (value: string) => void;
  onCreateGate: (event: React.FormEvent) => void;
  onEditGateStart: (gate: Gate) => void;
  onEditingGateNameChange: (value: string) => void;
  onUpdateGate: (event: React.FormEvent) => void;
  onCancelEditGate: () => void;
  onDeleteGate: (id: string, name: string) => void;
};

export default function GatesManagementCard({
  gates,
  newGateName,
  isCreatingGate,
  editingGateId,
  editingGateName,
  isUpdatingGate,
  onNewGateNameChange,
  onCreateGate,
  onEditGateStart,
  onEditingGateNameChange,
  onUpdateGate,
  onCancelEditGate,
  onDeleteGate,
}: GatesManagementCardProps) {
  return (
    <Card className="h-fit rounded-[1.4rem] border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
            <DoorOpen className="h-5 w-5" />
          </span>
          Entry Points
        </CardTitle>
        <CardDescription>Create and manage visitor entry locations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onCreateGate} className="flex gap-2 mb-6">
          <Input
            placeholder="Entry point name"
            value={newGateName}
            onChange={(e) => onNewGateNameChange(e.target.value)}
            className="bg-slate-50 border-slate-200 rounded-xl h-11"
            required
          />
          <Button type="submit" disabled={isCreatingGate || !newGateName.trim()} className="bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl h-11 px-6">
            {isCreatingGate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add entry point"}
          </Button>
        </form>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {gates.length === 0 ? (
            <EmptyState title="No entry points created yet" description="Add your first entry point to assign guards correctly." icon={DoorOpen} className="py-6" />
          ) : (
            gates.map((gate) => (
              <div key={gate.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col justify-center transition-colors">
                {editingGateId === gate.id ? (
                  <form onSubmit={onUpdateGate} className="flex gap-2 w-full items-center">
                    <Input
                      value={editingGateName}
                      onChange={(e) => onEditingGateNameChange(e.target.value)}
                      className="h-9 text-sm bg-white border-slate-200 rounded-lg"
                      autoFocus
                    />
                    <Button type="submit" size="sm" disabled={isUpdatingGate} className="h-9 px-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-lg">
                      Save Changes
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={onCancelEditGate} className="h-9 px-2 text-slate-500 hover:bg-slate-200 rounded-lg">
                      <X className="w-4 h-4" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm text-slate-700">{gate.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditGateStart(gate)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                        title="Edit entry point"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteGate(gate.id, gate.name)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                        title="Delete entry point"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
