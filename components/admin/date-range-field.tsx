"use client";
import { useState } from "react";
import { AdminInput } from "./admin-field";
import { cn } from "@/lib/utils";

type Preset = "today" | "7days" | "30days" | "thisMonth" | "custom";

interface DateRangeFieldProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  label?: string;
  className?: string;
}

const presets: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "7 days" },
  { value: "30days", label: "30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "custom", label: "Custom" },
];

function getPresetDates(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case "today": {
      const dateStr = today.toISOString().split('T')[0];
      return { from: dateStr, to: dateStr };
    }
    case "7days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
    }
    case "30days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
    }
    default:
      return { from: "", to: "" };
  }
}

export function DateRangeField({ from, to, onFromChange, onToChange, label, className }: DateRangeFieldProps) {
  const [activePreset, setActivePreset] = useState<Preset>("custom");
  
  const handlePresetClick = (preset: Preset) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      const dates = getPresetDates(preset);
      onFromChange(dates.from);
      onToChange(dates.to);
    }
  };
  
  const handleManualChange = () => {
    setActivePreset("custom");
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      {label && <label className="block text-xs font-medium text-foreground/90">{label}</label>}
      
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
              activePreset === preset.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3">
        <AdminInput
          type="date"
          value={from}
          onChange={(e) => {
            onFromChange(e.target.value);
            handleManualChange();
          }}
          label="From"
        />
        <AdminInput
          type="date"
          value={to}
          onChange={(e) => {
            onToChange(e.target.value);
            handleManualChange();
          }}
          label="To"
        />
      </div>
    </div>
  );
}
