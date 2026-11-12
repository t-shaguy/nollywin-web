/**
 * Print View Component
 * 
 * Renders a print-optimized view of report data.
 * Includes:
 * - Report title
 * - Active filters
 * - Generated date/time in Africa/Lagos
 * - Data table
 * - Page numbers (via CSS)
 */

"use client";
import { useEffect } from "react";

interface PrintViewProps {
  title: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  columns: Array<{ key: string; label: string }>;
  data: Record<string, unknown>[];
  onClose: () => void;
}

export function PrintView({ title, filters = {}, columns, data, onClose }: PrintViewProps) {
  useEffect(() => {
    // Add print-specific styles
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        body > *:not(.print-view-container) {
          display: none !important;
        }
        
        .print-view-container {
          display: block !important;
          padding: 20mm !important;
          background: white !important;
        }
        
        .print-header {
          margin-bottom: 15mm;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .print-table th {
          background: #f3f4f6;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          border: 1px solid #d1d5db;
        }
        
        .print-table td {
          padding: 6px 8px;
          font-size: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .print-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        
        /* Repeat table headers on each page */
        .print-table thead {
          display: table-header-group;
        }
        
        /* Prevent rows from breaking across pages */
        .print-table tr {
          page-break-inside: avoid;
        }
        
        /* Page numbers */
        @page {
          margin: 15mm;
          
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9px;
            color: #6b7280;
          }
        }
        
        /* Hide screen-only elements */
        .print-hide {
          display: none !important;
        }
      }
      
      @media screen {
        .print-view-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: white;
          overflow: auto;
          padding: 2rem;
        }
        
        .print-close-button {
          position: sticky;
          top: 1rem;
          right: 1rem;
          margin-left: auto;
          margin-bottom: 1rem;
          display: inline-block;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        
        .print-table th {
          background: #f3f4f6;
          padding: 0.5rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
        }
        
        .print-table td {
          padding: 0.5rem;
          font-size: 0.8125rem;
          border: 1px solid #e5e7eb;
        }
        
        .print-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatFilterValue = (value: unknown): string => {
    if (value == null || value === "") return "All";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  // Get current date/time in Africa/Lagos
  const generatedAt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  // Filter out empty/null filter values
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value != null && value !== ""
  );

  return (
    <div className="print-view-container">
      {/* Close button (screen only) */}
      <div className="print-close-button print-hide">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors mr-3"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Print header */}
      <div className="print-header">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-600 mb-4">
          Generated on {generatedAt} (Africa/Lagos)
        </p>

        {activeFilters.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Active Filters:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {activeFilters.map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span>{" "}
                  <span>{formatFilterValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Total records: {data.length.toLocaleString()}
        </p>
      </div>

      {/* Data table */}
      {data.length > 0 ? (
        <table className="print-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {(() => {
                      const value = row[col.key];
                      if (value == null || value === "") return "—";
                      if (typeof value === "object") return JSON.stringify(value);
                      return String(value);
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 py-8">No data to display</p>
      )}
    </div>
  );
}
