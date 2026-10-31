"use client";

import Image from "next/image";
import { X } from "lucide-react";

type PhotoLightboxProps = {
  photoUrl: string | null;
  onClose: () => void;
};

export default function PhotoLightbox({ photoUrl, onClose }: PhotoLightboxProps) {
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 z-[80] flex flex-col items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full flex flex-col items-center">
        <button
          className="absolute -top-14 right-0 text-white/80 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full p-2 transition-all"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size={24} />
        </button>
        <Image
          src={photoUrl}
          alt="Enlarged security photo"
          width={1000}
          height={1000}
          className="w-full h-auto rounded-2xl shadow-2xl border border-white/10 object-contain max-h-[85vh] bg-slate-50"
          onClick={(e) => e.stopPropagation()}
          unoptimized
        />
      </div>
    </div>
  );
}
