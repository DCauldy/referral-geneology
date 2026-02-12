"use client";

import { useRef, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import {
  SearchCommand,
  type SearchCommandRef,
} from "@/components/shared/search-command";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<SearchCommandRef>(null);

  return (
    <div className="min-h-screen bg-primary-50/50 dark:bg-primary-950">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => searchRef.current?.open()}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <SearchCommand ref={searchRef} />
    </div>
  );
}
