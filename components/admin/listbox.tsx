"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface ListboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showSearch?: boolean; // Auto-enabled when >7 options
}

export function Listbox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  error,
  disabled = false,
  className,
  showSearch,
}: ListboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const shouldShowSearch = showSearch ?? options.length > 7;
  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (open && shouldShowSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, shouldShowSearch]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          onChange(filteredOptions[highlightedIndex].value);
          setOpen(false);
          setSearchQuery("");
        }
        break;
      case "Home":
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;
      default:
        // Type-ahead (if not using search input)
        if (!shouldShowSearch && e.key.length === 1) {
          const query = e.key.toLowerCase();
          const index = filteredOptions.findIndex((opt) =>
            opt.label.toLowerCase().startsWith(query)
          );
          if (index !== -1) {
            setHighlightedIndex(index);
          }
        }
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full h-8 px-3 text-[13px] rounded-lg text-left flex items-center justify-between gap-2",
          "bg-background border border-input",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
          "transition-colors duration-120",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-[var(--danger)] focus:ring-[var(--danger)]/50 focus:border-[var(--danger)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground/60")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={cn("text-muted-foreground transition-transform duration-120", open && "rotate-180")}
        />
      </button>

      {error && <p className="text-xs text-[var(--danger)] mt-1.5">{error}</p>}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.14 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
            style={{ transformOrigin: "top" }}
            role="listbox"
          >
            {/* Search Input */}
            {shouldShowSearch && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder="Search..."
                    className="w-full h-7 pl-8 pr-3 text-xs rounded-md bg-background border border-input focus:outline-none focus:ring-1 focus:ring-ring/50"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-[13px] text-left flex items-center justify-between gap-2",
                      "transition-colors duration-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      highlightedIndex === index && !option.disabled && "bg-secondary",
                      option.value === value && "font-medium"
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon}
                      {option.label}
                    </span>
                    {option.value === value && (
                      <Check size={14} strokeWidth={1.5} className="text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
