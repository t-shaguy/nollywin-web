import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
  muted?: boolean;
}

/**
 * Standardized icon wrapper for admin
 * All icons: 16px default, strokeWidth 1.5, muted by default
 */
export function Icon({ icon: IconComponent, size = "md", className, muted = true }: IconProps) {
  const sizes = {
    sm: 14,   // Small buttons
    md: 16,   // Default
    lg: 20,   // Stat cards
  };

  return (
    <IconComponent
      size={sizes[size]}
      strokeWidth={1.5}
      className={cn(
        muted && "text-muted-foreground",
        className
      )}
    />
  );
}
