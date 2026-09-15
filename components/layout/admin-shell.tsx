"use client";
import { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopBar } from "./admin-top-bar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">
        <AdminTopBar />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-8 max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
