"use client";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api/client";

const PREFS = [
  { key: "push", label: "Push notifications" },
  { key: "email", label: "Email updates" },
  { key: "raffleReminders", label: "Raffle reminders" },
] as const;

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ push: true, email: true, raffleReminders: false });

  const toggle = async (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await apiClient("/users/notifications", { method: "PUT", body: JSON.stringify(next) });
    } catch {
      // TODO: revert on failure once backend is live
    }
  };

  return (
    <div className="divide-y divide-border">
      {PREFS.map((p) => (
        <div key={p.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
          <span className="text-sm font-medium text-foreground">{p.label}</span>
          <Switch checked={prefs[p.key]} onChange={() => toggle(p.key)} />
        </div>
      ))}
    </div>
  );
}