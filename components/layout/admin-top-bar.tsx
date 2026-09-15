"use client";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminTopBar() {
  return (
    <header className="shrink-0 h-20 border-b border-border px-8 flex items-center justify-between gap-8">
      <div className="relative flex-1 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search users, games..."
          className="pl-11"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          A
        </div>
      </div>
    </header>
  );
}
