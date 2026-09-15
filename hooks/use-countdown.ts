import { useState, useEffect, useCallback } from "react";

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const reset = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);

  return { seconds, isActive: seconds > 0, reset };
}