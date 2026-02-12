"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-x-4 border-b border-red-200/30 bg-red-950/95 px-4 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-red-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="size-6" />
          </button>
          <span className="font-serif text-sm font-semibold text-white">
            Trellis Admin
          </span>
        </div>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
