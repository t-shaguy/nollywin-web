import { ReactNode } from "react";

export function AdminCard({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-3 sm:p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {title && <h2 className="text-sm sm:text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
