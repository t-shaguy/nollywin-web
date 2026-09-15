"use client";
import { useEffect, useState } from "react";

function getRemaining(targetDate: Date) {
  const diffMs = Math.max(targetDate.getTime() - Date.now(), 0);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export function Countdown({ targetDate }: { targetDate: Date }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(targetDate)), 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="font-bold text-primary">
      {remaining.days.toString().padStart(2, "0")}d {remaining.hours.toString().padStart(2, "0")}h{" "}
      {remaining.minutes.toString().padStart(2, "0")}m
    </span>
  );
}
