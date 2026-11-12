/**
 * Download Menu Component
 * 
 * Provides CSV and PDF download options for admin reports.
 * - CSV: Fetches all pages and generates downloadable file
 * - PDF: Opens print dialog with print-optimized view
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { Download, FileText, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportKey, getReportConfig } from "@/lib/export/report-config";
import { downloadCsv } from "@/lib/export/csv";

interface DownloadMenuProps {
  reportKey: ReportKey;
  filters?: Record<string, unknown>;
  disabled?: boolean;
  onPrintClick: () => void;
}

export function DownloadMenu({ reportKey, filters = {}, disabled = false, onPrintClick }: DownloadMenuProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCsvDownload = async () => {
    setIsOpen(false);
    
    try {
      setDownloading(true);
      setError(null);

      const config = getReportConfig(reportKey);
      if (!config) {
        throw new Error("Report configuration not found");
      }

      // Fetch all data with current filters
      const data = await config.fetchAll(filters);

      if (data.length === 0) {
        setError("No data to export");
        return;
      }

      // Check if we hit the row limit
      const hitLimit = data.length >= 10000;

      // Generate filename with current date
      const today = new Date().toISOString().split("T")[0];
      const filename = `${reportKey}-${today}.csv`;

      // Download CSV
      downloadCsv({
        filename,
        columns: config.columns,
        data,
      });

      // Show warning if we hit the limit
      if (hitLimit) {
        alert("Exported the first 10,000 rows. Apply filters to export a smaller subset.");
      }
    } catch (err) {
      console.error("CSV download error:", err);
      setError(err instanceof Error ? err.message : "Failed to download CSV");
      alert(`Download failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePdfClick = () => {
    setIsOpen(false);
    onPrintClick();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button 
        variant="outline" 
        size="sm" 
        disabled={disabled || downloading}
        onClick={() => setIsOpen(!isOpen)}
      >
        {downloading ? (
          <>
            <Loader2 size={14} className="mr-1.5 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download size={14} className="mr-1.5" />
            Download
            <ChevronDown size={12} className="ml-1 opacity-50" />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={handleCsvDownload}
            disabled={downloading}
            className="w-full px-3 py-2 text-[13px] text-left hover:bg-secondary/50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={14} />
            CSV
          </button>
          <button
            onClick={handlePdfClick}
            disabled={downloading}
            className="w-full px-3 py-2 text-[13px] text-left hover:bg-secondary/50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 right-0 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
