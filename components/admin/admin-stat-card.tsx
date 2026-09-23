import { LucideIcon } from "lucide-react";

export function AdminStatCard({ 
  icon: Icon, 
  label, 
  value,
  iconColor = "text-primary",
  iconBg = "bg-primary/10"
}: { 
  icon: LucideIcon; 
  label: string; 
  value: string | number;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg ${iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
        <Icon size={16} className={iconColor} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
