export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary ${className}`}>
      {children}
    </span>
  );
}