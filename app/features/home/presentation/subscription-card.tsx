export function SubscriptionCard({
  planName,
  expiresAt,
  attemptsUsed,
  attemptsTotal,
}: {
  planName: string;
  expiresAt: string;
  attemptsUsed: number;
  attemptsTotal: number;
}) {
  const attemptsRemaining = Math.max(attemptsTotal - attemptsUsed, 0);
  const percentUsed = attemptsTotal > 0 ? Math.min((attemptsUsed / attemptsTotal) * 100, 100) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Active Plan</p>
          <p className="font-bold">{planName}</p>
        </div>
        <p className="text-xs text-muted-foreground">Expires {expiresAt}</p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{attemptsUsed} / {attemptsTotal} attempts used</span>
          <span>{attemptsRemaining} left</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${percentUsed}%` }} />
        </div>
      </div>
    </div>
  );
}
