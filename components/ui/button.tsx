import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gradient" | "outline" | "ghost" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ 
  variant = "gradient", 
  size = "lg", 
  loading = false,
  icon,
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  // Admin uses compact sizes, player app stays lg
  const sizeClasses = {
    sm: "h-7 px-3 text-[13px]",     // 28px height - admin small
    md: "h-8 px-3 text-[13px]",     // 32px height - admin default
    lg: "h-14 px-8 text-base",      // 56px height - player app (unchanged)
  };
  
  const borderRadiusClasses = {
    sm: "rounded",  // 4px for admin
    md: "rounded",  // 4px for admin
    lg: "rounded-xl",  // 12px for player
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "font-medium inline-flex items-center justify-center gap-2 transition-all duration-120 whitespace-nowrap",
        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        // Variants
        variant === "gradient" && "bg-brand-gradient text-white hover:opacity-90",
        variant === "outline" && "border border-border bg-transparent hover:bg-secondary",
        variant === "secondary" && "border border-border bg-secondary hover:bg-secondary/80",
        variant === "ghost" && "border-0 bg-transparent hover:bg-secondary",
        variant === "danger" && "bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-[var(--danger)]/20",
        sizeClasses[size],
        borderRadiusClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "lg" ? 18 : 14} className="animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
