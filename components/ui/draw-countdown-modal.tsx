"use client";
import React, { useEffect } from "react";
import { X, Calendar, Trophy } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { formatDateRange, formatDrawDate, getCalendarDaysUntil, getCountdownMessage } from "@/lib/utils/draw-countdown";

interface DrawCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawDate: string;
  prizeName: string;
  startsOn: string;
  endsOn: string;
  myPoints: number;
  raffleCode: string;
}

export function DrawCountdownModal({
  isOpen,
  onClose,
  drawDate,
  prizeName,
  startsOn,
  endsOn,
  myPoints,
  raffleCode,
}: DrawCountdownModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  if (!mounted || !isOpen) return null;

  const daysUntilDraw = getCalendarDaysUntil(drawDate);
  const countdownText = daysUntilDraw !== null ? getCountdownMessage(daysUntilDraw) : null;
  const dateRange = formatDateRange(startsOn, endsOn);
  const formattedDrawDate = formatDrawDate(drawDate);

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{
        animation: prefersReducedMotion ? "none" : "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="relative bg-card border border-border rounded-t-2xl md:rounded-2xl p-5 md:p-6 w-full max-w-md shadow-2xl max-h-[90dvh] md:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: prefersReducedMotion ? "none" : "scaleIn 0.2s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center space-y-5 md:space-y-6 mt-2">
          {/* Countdown */}
          {countdownText && (
            <div className="space-y-2">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Calendar size={24} className="sm:w-7 sm:h-7 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold break-words px-2">Draw is {countdownText}</h2>
            </div>
          )}

          {/* Prize name */}
          <div className="px-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Draw Prize</p>
            <h3 className="text-base sm:text-lg font-bold break-words">{prizeName}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{raffleCode}</p>
          </div>

          {/* Draw date */}
          <div className="bg-secondary/50 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Draw Date</p>
              <p className="font-semibold text-sm sm:text-base break-words">{formattedDrawDate}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Qualifying Period</p>
              <p className="text-xs sm:text-sm break-words">{dateRange}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Play games during this period to earn points</p>
            </div>
          </div>

          {/* Your points */}
          <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-xl py-3 px-3">
            <Trophy size={16} className="sm:w-[18px] sm:h-[18px] text-primary flex-shrink-0" />
            <span className="font-bold text-sm sm:text-base text-primary">Your Points: {myPoints}</span>
          </div>

          {/* Got it button */}
          <Button onClick={onClose} className="w-full min-h-[48px] text-sm sm:text-base">
            Got it
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
