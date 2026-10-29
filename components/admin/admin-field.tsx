import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// Base field wrapper with label
interface FieldWrapperProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({ label, error, helper, required, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-medium text-foreground">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      {children}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

// Input field - 32px height
interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, helper, className, required, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} helper={helper} required={required}>
        <input
          ref={ref}
          className={cn(
            "w-full h-8 px-3 text-[13px] rounded",
            "bg-background border border-input",
            "text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-120",
            error && "border-[var(--danger)] focus:ring-[var(--danger)]/50 focus:border-[var(--danger)]",
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
AdminInput.displayName = "AdminInput";

// Select field - will be replaced by custom listbox, but keep for backward compat
interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ label, error, helper, options, className, required, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} helper={helper} required={required}>
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full h-8 px-3 text-[13px] rounded appearance-none pr-8",
              "bg-background border border-input",
              "text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-120",
              error && "border-[var(--danger)] focus:ring-[var(--danger)]/50 focus:border-[var(--danger)]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron icon */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </FieldWrapper>
    );
  }
);
AdminSelect.displayName = "AdminSelect";

// Textarea - compact
interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  rows?: number;
}

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ label, error, helper, className, required, rows = 3, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} helper={helper} required={required}>
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "w-full px-3 py-2 text-[13px] rounded-lg",
            "bg-background border border-input",
            "text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-120 resize-none",
            error && "border-[var(--danger)] focus:ring-[var(--danger)]/50 focus:border-[var(--danger)]",
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
AdminTextarea.displayName = "AdminTextarea";
