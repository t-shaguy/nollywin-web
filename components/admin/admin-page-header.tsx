import { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
