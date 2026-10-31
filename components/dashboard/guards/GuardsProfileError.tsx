"use client";

import { ShieldAlert } from "lucide-react";

export default function GuardsProfileError() {
  return (
    <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex flex-col items-center max-w-md text-center shadow-sm">
        <ShieldAlert className="w-10 h-10 mb-3" />
        <h2 className="font-bold text-lg">Profile Error</h2>
        <p className="text-sm mt-1">Could not verify your building manager profile. Please try logging out and back in.</p>
      </div>
    </div>
  );
}
