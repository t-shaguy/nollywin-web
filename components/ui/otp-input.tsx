import { useRef } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number; // Support variable length (default 6 for backward compat)
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < length - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  // Find the first empty box index (the "active" one)
  const firstEmptyIndex = value.findIndex((v) => !v);
  const activeIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => {
        const isFilled = !!value[i];
        const isActive = i === activeIndex;
        
        return (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl rounded-xl border-2 bg-white/5 text-white focus:outline-none transition-colors ${
              isActive && !isFilled
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-white/10 focus:border-primary"
            }`}
          />
        );
      })}
    </div>
  );
}