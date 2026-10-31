"use client";

import Link from "next/link";
import { AlertOctagon, LifeBuoy, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HardLockedScreenProps = {
  onBackToLogin: () => void;
};

export function HardLockedScreen({ onBackToLogin }: HardLockedScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 sm:p-6">
      <Card className="w-full max-w-lg border-red-200 bg-white shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Workspace access locked</CardTitle>
          <CardDescription className="mx-auto max-w-sm leading-6 text-slate-500">
            This workspace has been locked by the platform administrator. Please complete payment or contact support to restore access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700 cursor-pointer">
            <Link href="/contact">
              <LifeBuoy className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
          <Button variant="destructive" onClick={onBackToLogin}>
            <LogOut className="h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
