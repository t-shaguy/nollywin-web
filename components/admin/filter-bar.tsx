"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  activeFilters?: { key: string; label: string; value: string }[];
  onRemoveFilter?: (key: string) => void;
  className?: string;
  showActions?: boolean;
  applyLabel?: string;
  resetLabel?: string;
}

export function FilterBar({
  children,
  onApply,
  onReset,
  activeFilters = [],
  onRemoveFilter,
  className,
  showActions = true,
  applyLabel = "Apply",
  resetLabel = "Reset",
}: FilterBarProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter controls in responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
        {children}
        
        {/* Actions column */}
        {showActions && (onApply || onReset) && (
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            {onApply && (
              <button
                type="button"
                onClick={onApply}
                className="flex-1 h-9 px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {applyLabel}
              </button>
            )}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="h-9 px-4 py-2 text-sm font-medium rounded-lg bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors whitespace-nowrap"
              >
                {resetLabel}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Active filter chips */}
      {activeFilters.length > 0 && onRemoveFilter && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground py-1">Active filters:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors group"
            >
              <span className="text-muted-foreground">{filter.label}:</span>
              <span className="text-foreground">{filter.value}</span>
              <X size={12} className="text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
