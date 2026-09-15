function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const labels = ["Weak", "Fair", "Good", "Strong"];
const colors = ["bg-destructive", "bg-yellow-500", "bg-blue-500", "bg-primary"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = Math.max(1, getStrength(password));
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score - 1] : "bg-border"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{labels[score - 1]}</p>
    </div>
  );
}