/**
 * Shared Data Table Component
 * 
 * Global rules enforced:
 * - No cramped cells: px-4 py-3 minimum padding
 * - No wrapping: white-space: nowrap on all cells
 * - Row height: minimum 52px
 * - Horizontal scroll in card, never whole page
 * - Sticky header
 * - Sticky first column on desktop (>768px)
 * - Consistent typography
 */

import { cn } from "@/lib/utils";
import React from "react";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
}

interface DataTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DataTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface DataTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface DataTableHeadProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sticky?: boolean;
}

interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sticky?: boolean;
  secondary?: boolean;
}

/**
 * Main table wrapper with scroll container
 */
export function DataTableContainer({ 
  children, 
  className,
  stickyFirstColumn = false 
}: DataTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className={cn(
        "overflow-x-auto relative",
        // Subtle scrollbar styling
        "[&::-webkit-scrollbar]:h-2",
        "[&::-webkit-scrollbar-track]:bg-secondary/30",
        "[&::-webkit-scrollbar-thumb]:bg-border",
        "[&::-webkit-scrollbar-thumb]:rounded",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30"
      )}>
        <table className={cn(
          "w-full min-w-max text-sm",
          stickyFirstColumn && "[&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-20 [&_th:first-child]:bg-secondary/50",
          stickyFirstColumn && "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-card",
          stickyFirstColumn && "md:[&_th:first-child]:sticky md:[&_td:first-child]:sticky",
          className
        )}>
          {children}
        </table>
      </div>
    </div>
  );
}

/**
 * Table header with sticky positioning
 */
export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead className={cn(
      "bg-secondary/50 sticky top-0 z-10",
      "border-b border-border",
      className
    )}>
      {children}
    </thead>
  );
}

/**
 * Table body
 */
export function DataTableBody({ children, className }: DataTableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

/**
 * Table row with hover state and min height
 */
export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr 
      className={cn(
        "border-b border-border last:border-0",
        "hover:bg-secondary/30 transition-colors",
        "min-h-[52px]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/**
 * Table header cell with no-wrap and consistent padding
 */
export function DataTableHead({ 
  children, 
  className, 
  align = "left",
  sticky = false
}: DataTableHeadProps) {
  return (
    <th className={cn(
      "px-5 py-4 font-semibold text-foreground whitespace-nowrap",
      align === "left" && "text-left",
      align === "right" && "text-right",
      align === "center" && "text-center",
      sticky && "sticky left-0 z-20 bg-secondary/50",
      className
    )}>
      {children}
    </th>
  );
}

/**
 * Table data cell with no-wrap and consistent padding
 * Supports optional secondary line (muted text below primary)
 */
export function DataTableCell({ 
  children, 
  className, 
  align = "left",
  sticky = false,
  secondary = false
}: DataTableCellProps) {
  return (
    <td className={cn(
      "px-5 py-3 whitespace-nowrap",
      align === "left" && "text-left",
      align === "right" && "text-right",
      align === "center" && "text-center",
      sticky && "sticky left-0 z-10 bg-card",
      secondary && "text-xs text-muted-foreground",
      className
    )}>
      {children}
    </td>
  );
}

/**
 * Helper component for two-line cell content (primary + secondary)
 */
export function DataTableCellStack({ 
  primary, 
  secondary,
  className 
}: { 
  primary: React.ReactNode; 
  secondary: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="font-medium leading-tight">{primary}</div>
      <div className="text-xs text-muted-foreground leading-tight">{secondary}</div>
    </div>
  );
}

/**
 * Empty state for tables
 */
export function DataTableEmpty({ 
  message = "No data available",
  icon,
  action
}: { 
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      {icon && <div className="flex justify-center mb-3">{icon}</div>}
      <p className="text-muted-foreground text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

/**
 * Loading skeleton for tables
 */
export function DataTableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <DataTableContainer>
      <DataTableHeader>
        <DataTableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <DataTableHead key={i}>
              <div className="h-4 bg-secondary/50 rounded animate-pulse w-20" />
            </DataTableHead>
          ))}
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <DataTableRow key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <DataTableCell key={colIdx}>
                <div className="h-4 bg-secondary/30 rounded animate-pulse w-24" />
              </DataTableCell>
            ))}
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTableContainer>
  );
}

/**
 * Truncated text cell with tooltip
 */
export function DataTableTextTruncate({ 
  text, 
  maxWidth = "280px" 
}: { 
  text: string; 
  maxWidth?: string;
}) {
  return (
    <span 
      className="block truncate" 
      style={{ maxWidth }}
      title={text}
    >
      {text}
    </span>
  );
}
