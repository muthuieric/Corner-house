"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  exact?: boolean;
};

type DashboardSidebarProps = {
  brand?: string;
  logoUrl?: string | null;
  subtitle?: string;
  accent?: "default" | "dark";
  pathname: string;
  navItems: DashboardNavItem[];
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onLogout: () => void;
};

function isActive(pathname: string, item: DashboardNavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarHeader({
  brand = "Karibu VMS",
  logoUrl,
  subtitle = "Admin",
}: {
  brand?: string;
  logoUrl?: string | null;
  subtitle?: string;
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-2.5">
        {logoUrl ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-100 p-0.5 shadow-sm">
            <Image
              src={logoUrl}
              alt={`${brand} logo`}
              width={32}
              height={32}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <Image
            src="/icon.svg"
            alt="Karibu VMS logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
        )}
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-black text-slate-900 leading-none">{brand}</span>
          <span className="mt-1 w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function getTourId(href: string) {
  if (href === "/dashboard/company-admin") return "tour-sidebar-home";
  const parts = href.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];
  return lastPart ? `tour-sidebar-${lastPart}` : undefined;
}

function NavLinks({
  pathname,
  navItems,
  onNavigate,
}: {
  pathname: string;
  navItems: DashboardNavItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {navItems.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        const tourId = getTourId(item.href);

        return (
          <Link
            key={item.href}
            id={tourId}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
              active && !item.danger && "bg-blue-50 text-blue-700",
              active && item.danger && "bg-red-50 text-red-700",
              !active && "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {Icon && (
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  active && !item.danger && "border-blue-100 bg-white text-blue-700",
                  active && item.danger && "border-red-100 bg-white text-red-700",
                  !active && !item.danger && "border-slate-100 bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700",
                  !active && item.danger && "border-red-100 bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-700"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({
  brand,
  logoUrl,
  subtitle,
  pathname,
  navItems,
  isMobileOpen,
  onMobileOpenChange,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between bg-[#F8FAFC] p-4 md:hidden">
        <SidebarHeader brand={brand} logoUrl={logoUrl} subtitle={subtitle} />
        <Button variant="ghost" size="icon" onClick={() => onMobileOpenChange(true)} aria-label="Open menu" className="text-slate-600">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <div className="relative flex h-full min-h-0 w-72 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-2 pr-4">
              <SidebarHeader brand={brand} logoUrl={logoUrl} subtitle={subtitle} />
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => onMobileOpenChange(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavLinks pathname={pathname} navItems={navItems} onNavigate={() => onMobileOpenChange(false)} />
            <div className="p-4 mb-4">
              <Button variant="ghost" className="w-full justify-start text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="z-10 hidden h-full min-h-0 w-64 shrink-0 flex-col bg-[#F8FAFC] md:flex">
        <SidebarHeader brand={brand} logoUrl={logoUrl} subtitle={subtitle} />
        <NavLinks pathname={pathname} navItems={navItems} />
        <div className="p-4 mb-4">
          <Button variant="ghost" className="w-full justify-start text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
