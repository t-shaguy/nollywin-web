export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl px-4 py-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
