"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

type WorkspaceLogoProps = {
  name?: string | null;
  logoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CONFIGS = {
  xs: {
    container: "h-6 w-6 rounded-md p-0.5",
    icon: "h-3.5 w-3.5",
    imgSize: 24,
  },
  sm: {
    container: "h-7 w-7 rounded-lg p-0.5",
    icon: "h-4 w-4",
    imgSize: 28,
  },
  md: {
    container: "h-10 w-10 rounded-xl p-1",
    icon: "h-5 w-5",
    imgSize: 40,
  },
  lg: {
    container: "h-12 w-12 rounded-2xl p-1.5",
    icon: "h-6 w-6",
    imgSize: 48,
  },
};

export function WorkspaceLogo({
  name,
  logoUrl,
  size = "md",
  className = "",
}: WorkspaceLogoProps) {
  const config = SIZE_CONFIGS[size];
  const displayName = name || "Workspace";

  if (logoUrl) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-sm ${config.container} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${displayName} logo`}
          width={config.imgSize}
          height={config.imgSize}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center border border-blue-100 bg-blue-50 text-blue-600 ${config.container} ${className}`}
    >
      <Building2 className={config.icon} />
    </span>
  );
}

export default WorkspaceLogo;

