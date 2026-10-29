import { getAvatarColor, getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AvatarInitialsProps {
  email: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarInitials({ email, size = "md", className }: AvatarInitialsProps) {
  const initials = getInitials(email);
  const color = getAvatarColor(email);
  
  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  };
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={email}
    >
      {initials}
    </div>
  );
}
