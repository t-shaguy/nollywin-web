import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gradient" | "outline";
}

export function Button({ variant = "gradient", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "font-semibold px-8 py-4 rounded-xl flex items-center gap-2 transition-opacity",
        variant === "gradient" && "bg-brand-gradient text-white hover:opacity-90",
        variant === "outline" && "border border-border text-foreground hover:bg-secondary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}