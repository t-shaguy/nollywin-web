"use client";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="shrink-0 h-14 sm:h-16 border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
      </div>
    </header>
  );
}
