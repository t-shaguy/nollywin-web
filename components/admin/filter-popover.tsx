"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { ListFilter, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Listbox, ListboxOption } from "./listbox";
import { AdminInput } from "./admin-field";
import { cn } from "@/lib/utils";

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[]; // string[] for date ranges
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "dateRange";
  operators: Array<{ value: string; label: string }>;
  options?: ListboxOption[]; // For select type
  presets?: Array<{ label: string; getValue: () => string | string[] }>; // For date type
}

interface FilterPopoverProps {
  fields: FilterFieldConfig[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  resultCount?: number;
  loading?: boolean;
  className?: string;
}

export function FilterPopover({
  fields,
  conditions,
  onChange,
  resultCount,
  loading = false,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [localConditions, setLocalConditions] = useState<FilterCondition[]>(conditions);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Sync external changes
  useEffect(() => {
    setLocalConditions(conditions);
  }, [conditions]);

  // Live update with debounce for text fields
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const handleConditionChange = (id: string, updates: Partial<FilterCondition>) => {
    const updated = localConditions.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    setLocalConditions(updated);

    // Find the condition
    const condition = updated.find((c) => c.id === id);
    if (!condition) return;

    const field = fields.find((f) => f.key === condition.field);

    // Apply immediately for selects and dates, debounce for text
    if (field?.type === "text") {
      // Clear existing timer
      if (debounceTimers.current[id]) {
        clearTimeout(debounceTimers.current[id]);
      }

      // Set new timer (300ms debounce)
      debounceTimers.current[id] = setTimeout(() => {
        onChange(updated);
      }, 300);
    } else {
      // Immediate for select/date
      onChange(updated);
    }
  };

  const handleAddCondition = () => {
    // Find first unused field
    const usedFields = new Set(localConditions.map((c) => c.field));
    const availableField = fields.find((f) => !usedFields.has(f.key));

    if (!availableField) return; // All fields used

    const newCondition: FilterCondition = {
      id: Math.random().toString(36).slice(2),
      field: availableField.key,
      operator: availableField.operators[0].value,
      value: availableField.type === "dateRange" ? ["", ""] : "",
    };

    const updated = [...localConditions, newCondition];
    setLocalConditions(updated);
    onChange(updated);
  };

  const handleRemoveCondition = (id: string) => {
    const updated = localConditions.filter((c) => c.id !== id);
    setLocalConditions(updated);
    onChange(updated);

    // Clear debounce timer
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
  };

  const handleClearAll = () => {
    setLocalConditions([]);
    onChange([]);

    // Clear all timers
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  };

  // Click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Get available fields (exclude already used ones)
  const getAvailableFields = (currentFieldKey: string): ListboxOption[] => {
    const usedFields = new Set(localConditions.map((c) => c.field).filter((f) => f !== currentFieldKey));
    return fields
      .filter((f) => !usedFields.has(f.key) || f.key === currentFieldKey)
      .map((f) => ({ value: f.key, label: f.label, disabled: usedFields.has(f.key) }));
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-8 px-3 text-[13px] font-medium rounded-lg flex items-center gap-2",
          "border border-border bg-transparent hover:bg-secondary",
          "transition-colors duration-120",
          open && "bg-secondary"
        )}
      >
        <ListFilter size={16} strokeWidth={1.5} className="text-muted-foreground" />
        <span>Filters</span>
        {conditions.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--neutral-bg)] text-[var(--neutral)] border border-[var(--neutral-border)]">
            {conditions.length}
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.14 }}
            className="absolute z-50 mt-1 w-[min(520px,92vw)] bg-card border border-border rounded-xl shadow-2xl right-0"
            style={{ transformOrigin: "top right" }}
          >
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Condition Rows */}
              {localConditions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No filters applied. Add a condition to get started.
                </div>
              ) : (
                localConditions.map((condition, index) => (
                  <FilterConditionRow
                    key={condition.id}
                    condition={condition}
                    fields={fields}
                    availableFields={getAvailableFields(condition.field)}
                    isFirst={index === 0}
                    onChange={(updates) => handleConditionChange(condition.id, updates)}
                    onRemove={() => handleRemoveCondition(condition.id)}
                  />
                ))
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleAddCondition}
                  disabled={localConditions.length >= fields.length}
                  className="h-7 px-2.5 text-xs font-medium rounded-lg flex items-center gap-1.5 border-0 bg-transparent hover:bg-secondary transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} strokeWidth={1.5} />
                  Add condition
                </button>

                {localConditions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="h-7 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-120"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Thin loading progress bar */}
            {loading && (
              <div className="h-0.5 bg-secondary relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Single filter condition row
 */
interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterFieldConfig[];
  availableFields: ListboxOption[];
  isFirst: boolean;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  fields,
  availableFields,
  isFirst,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const field = fields.find((f) => f.key === condition.field);
  if (!field) return null;

  return (
    <div className="flex items-start gap-2">
      {/* Label: Where / And */}
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2 w-12 shrink-0">
        {isFirst ? "Where" : "And"}
      </div>

      {/* Field Select */}
      <div className="w-[150px] shrink-0">
        <Listbox
          value={condition.field}
          onChange={(value) => {
            const newField = fields.find((f) => f.key === value);
            if (newField) {
              onChange({
                field: value,
                operator: newField.operators[0].value,
                value: newField.type === "dateRange" ? ["", ""] : "",
              });
            }
          }}
          options={availableFields}
        />
      </div>

      {/* Operator Select */}
      <div className="w-[110px] shrink-0">
        <Listbox
          value={condition.operator}
          onChange={(value) => onChange({ operator: value })}
          options={field.operators}
        />
      </div>

      {/* Value Input */}
      <div className="flex-1 min-w-0">
        {field.type === "select" && field.options && (
          <Listbox
            value={typeof condition.value === "string" ? condition.value : ""}
            onChange={(value) => onChange({ value })}
            options={field.options}
          />
        )}

        {field.type === "text" && (
          <AdminInput
            value={typeof condition.value === "string" ? condition.value : ""}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Search..."
          />
        )}

        {field.type === "dateRange" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={(condition.value as string[])[0] || ""}
              onChange={(e) => {
                const [, to] = condition.value as string[];
                onChange({ value: [e.target.value, to] });
              }}
              className="flex-1 h-8 px-2 text-xs rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring/50"
              style={{ colorScheme: "dark" }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={(condition.value as string[])[1] || ""}
              onChange={(e) => {
                const [from] = condition.value as string[];
                onChange({ value: [from, e.target.value] });
              }}
              className="flex-1 h-8 px-2 text-xs rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring/50"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}

        {/* Date presets for dateRange */}
        {field.type === "dateRange" && field.presets && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {field.presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange({ value: preset.getValue() })}
                className="px-2 py-0.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-120 shrink-0"
        aria-label="Remove condition"
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/**
 * Filter chips - shows active filters below toolbar
 */
interface FilterChipsProps {
  conditions: FilterCondition[];
  fields: FilterFieldConfig[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({ conditions, fields, onRemove, onClearAll, className }: FilterChipsProps) {
  if (conditions.length === 0) return null;

  const getChipLabel = (condition: FilterCondition): string => {
    const field = fields.find((f) => f.key === condition.field);
    if (!field) return "";

    const operator = field.operators.find((op) => op.value === condition.operator);
    let valueDisplay = "";

    if (field.type === "select" && field.options) {
      const val = typeof condition.value === "string" ? condition.value : "";
      const option = field.options.find((opt) => opt.value === val);
      valueDisplay = option?.label || val;
    } else if (field.type === "dateRange" && Array.isArray(condition.value)) {
      const [from, to] = condition.value;
      valueDisplay = `${from || "..."} to ${to || "..."}`;
    } else {
      valueDisplay = typeof condition.value === "string" ? condition.value : "";
    }

    return `${field.label} ${operator?.label.toLowerCase() || ""} ${valueDisplay}`;
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {conditions.map((condition) => (
        <button
          key={condition.id}
          type="button"
          onClick={() => onRemove(condition.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors group"
        >
          <span className="truncate max-w-xs">{getChipLabel(condition)}</span>
          <X size={12} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground shrink-0" />
        </button>
      ))}

      {conditions.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
