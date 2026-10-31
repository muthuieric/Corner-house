"use client";

import { Compass, ContactRound, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { Button } from "@/components/ui/button";

type GuardsPageHeaderProps = {
  onAddGuard: () => void;
  onTakeTour?: () => void;
};

export default function GuardsPageHeader({ onAddGuard, onTakeTour }: GuardsPageHeaderProps) {
  return (
    <div id="tour-guards-header">
      <PageHeader
        title="Security team"
        description="Manage guards and assign them to entry points."
        icon={ContactRound}
      >
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          {onTakeTour && (
            <Button
              type="button"
              variant="outline"
              onClick={onTakeTour}
              className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl h-11 px-4"
            >
               Page Tour
            </Button>
          )}
          <Button
            id="tour-guards-add-btn"
            onClick={onAddGuard}
            className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl h-11 px-6"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Guard
          </Button>
        </div>
      </PageHeader>
    </div>
  );
}
