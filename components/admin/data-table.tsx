"use client";
import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  expandable?: boolean;
  renderExpanded?: (item: T) => ReactNode;
  pagination?: {
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
    onSizeChange?: (size: number) => void;
  };
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  expandable = false,
  renderExpanded,
  pagination,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const toggleExpand = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.size) : 1;
  const startItem = pagination ? (pagination.page - 1) * pagination.size + 1 : 1;
  const endItem = pagination
    ? Math.min(pagination.page * pagination.size, pagination.total)
    : data.length;
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Table wrapper with horizontal scroll */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {expandable && <th className="w-10"></th>}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-foreground/90 whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    !col.align && "text-left",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const key = keyExtractor(item);
              const isExpanded = expandedRows.has(key);
              
              return (
                <React.Fragment key={key}>
                  <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    {expandable && (
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-muted-foreground" />
                          ) : (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-sm",
                          col.align === "right" && "text-right tabular-nums",
                          col.align === "center" && "text-center",
                          !col.align && "text-left",
                          col.className
                        )}
                      >
                        {col.render ? col.render(item) : String(item[col.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded && renderExpanded && (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-3 bg-secondary/20">
                        {renderExpanded(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-muted-foreground">
            Showing {formatNumber(startItem)} to {formatNumber(endItem)} of {formatNumber(pagination.total)} results
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page size selector */}
            {pagination.onSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <select
                  value={pagination.size}
                  onChange={(e) => pagination.onSizeChange!(Number(e.target.value))}
                  className="h-8 px-2 text-sm rounded-lg bg-background border border-input"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            )}
            
            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 px-3 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm text-foreground">{pagination.page}</span>
                <span className="text-sm text-muted-foreground">of</span>
                <span className="text-sm text-foreground">{totalPages}</span>
              </div>
              
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="h-8 px-3 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// React import for Fragment
import React from "react";
