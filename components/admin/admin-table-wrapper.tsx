import { ReactNode } from "react";

export function AdminTableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
