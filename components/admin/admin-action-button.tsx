import { ButtonHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface AdminActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
}

export function AdminActionButton({
  icon: Icon,
  variant = "primary",
  size = "sm",
  className = "",
  children,
  ...props
}: AdminActionButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    success: "bg-green-500 text-white hover:bg-green-600",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
