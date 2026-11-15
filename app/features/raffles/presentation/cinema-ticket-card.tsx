/**
 * Cinema Ticket Draw Card
 * 
 * Visual Design:
 * - Notched ticket silhouette with CSS mask
 * - Dashed perforation line between main and stub
 * - Film-strip sprocket holes along edges
 * - Decorative barcode at bottom
 * - Responsive: min-width 320px, two-column at 1024px+
 * 
 * States:
 * - WINNER: Gradient background, glow effect, shimmer animation
 * - NOT_SELECTED: Charcoal grey
 * - PENDING: Amber outline, awaiting draw
 * - ACTIVE: Countdown timer, gradient border
 */

"use client";
import { Trophy, Calendar, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { type RaffleDraw } from "@/lib/api/leaderboard";
import { formatDrawDate, getCalendarDaysUntil, getCountdownMessage } from "@/lib/utils/draw-countdown";

interface CinemaTicketCardProps {
  draw: RaffleDraw;
  state: "WINNER" | "NOT_SELECTED" | "PENDING" | "ACTIVE";
  onShowCountdown?: () => void;
}

export function CinemaTicketCard({ draw, state, onShowCountdown }: CinemaTicketCardProps) {
  const drawDateFormatted = draw.drawDate ? formatDrawDate(draw.drawDate) : null;
  const daysUntilDraw = draw.drawDate ? getCalendarDaysUntil(draw.drawDate) : null;
  const countdownText = daysUntilDraw !== null ? getCountdownMessage(daysUntilDraw) : null;

  // Determine colors based on state
  const stateStyles = {
    WINNER: {
      bg: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
      border: "border-amber-300",
      glow: "shadow-[0_0_30px_rgba(251,191,36,0.5)]",
      text: "text-white",
    },
    NOT_SELECTED: {
      bg: "bg-gradient-to-br from-gray-700 to-gray-800",
      border: "border-gray-600",
      glow: "",
      text: "text-gray-300",
    },
    PENDING: {
      bg: "bg-gradient-to-br from-gray-800 to-gray-900",
      border: "border-amber-500 border-2",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      text: "text-white",
    },
    ACTIVE: {
      bg: "bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900",
      border: "border-primary border-2",
      glow: "shadow-[0_0_25px_rgba(244,2,137,0.4)]",
      text: "text-white",
    },
  };

  const styles = stateStyles[state];

  // Animation for shimmer
  const shimmerTransition = {
    repeat: Number.POSITIVE_INFINITY,
    duration: 3,
    ease: "linear" as const,
    repeatDelay: 2,
  };

  return (
    <motion.div
      className="relative"
      style={{ minWidth: "320px" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={state === "ACTIVE" ? { y: -4 } : undefined}
      transition={{ duration: 0.4 }}
    >
      {/* Main Ticket Container with notch */}
      <div
        className={`
          relative overflow-hidden rounded-2xl
          ${styles.bg} ${styles.border} ${styles.glow}
          transition-all duration-300
        `}
        style={{
          clipPath: `polygon(
            0 0, 100% 0,
            100% 8%, 98% 10%, 100% 12%,
            100% 18%, 98% 20%, 100% 22%,
            100% 28%, 98% 30%, 100% 32%,
            100% 100%, 0 100%,
            0 68%, 2% 70%, 0 72%,
            0 62%, 2% 64%, 0 66%,
            0 56%, 2% 58%, 0 60%,
            0 0
          )`,
        }}
      >
        {/* Shimmer overlay for WINNER */}
        {state === "WINNER" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={shimmerTransition}
          />
        )}

        {/* Main Content Area */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`
                h-14 w-14 rounded-xl flex items-center justify-center shrink-0
                ${state === "WINNER" ? "bg-white/20" : "bg-white/10"}
              `}
            >
              <Trophy size={24} className={state === "WINNER" ? "text-white" : "text-gray-300"} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg ${styles.text} break-words`}>{draw.prizeName}</h3>
              <p className={`text-sm ${state === "WINNER" ? "text-white/80" : "text-gray-400"} mt-1`}>
                {draw.scheduleLabel}
              </p>
            </div>
          </div>

          {/* Draw Date */}
          {drawDateFormatted && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${
                state === "WINNER" ? "bg-white/10" : "bg-white/5"
              }`}
            >
              <Calendar size={18} className={state === "WINNER" ? "text-white/90" : "text-gray-400"} />
              <div className="flex-1">
                <p className={`text-xs ${state === "WINNER" ? "text-white/70" : "text-gray-500"}`}>
                  Draw Date
                </p>
                <p className={`text-sm font-medium ${styles.text}`}>{drawDateFormatted}</p>
              </div>
              {countdownText && state === "ACTIVE" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20">
                  <Clock size={14} className="text-primary" />
                  <span className="text-xs font-semibold text-primary">{countdownText}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-4 rounded-lg ${state === "WINNER" ? "bg-white/15" : "bg-white/5"} border ${
                state === "WINNER" ? "border-white/20" : "border-white/10"
              }`}
            >
              <p className={`text-xs ${state === "WINNER" ? "text-white/70" : "text-gray-500"} mb-1`}>
                Your Points
              </p>
              <p className={`text-3xl font-bold ${styles.text}`}>
                {draw.myPoints !== null && draw.myPoints !== undefined ? draw.myPoints : "-"}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${state === "WINNER" ? "bg-white/15" : "bg-white/5"} border ${
                state === "WINNER" ? "border-white/20" : "border-white/10"
              }`}
            >
              <p className={`text-xs ${state === "WINNER" ? "text-white/70" : "text-gray-500"} mb-1`}>
                Total Entries
              </p>
              <p className={`text-3xl font-bold ${styles.text}`}>{draw.entryCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Perforation Line */}
        <div className="relative h-6">
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed"
            style={{
              borderColor: state === "WINNER" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
            }}
          />
        </div>

        {/* Stub Area */}
        <div className="px-6 pb-6 space-y-3">
          {/* Entry Count Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className={state === "WINNER" ? "text-white/80" : "text-gray-400"} />
              <span className={`text-xs ${styles.text}`}>Entries</span>
            </div>
            <span className={`text-2xl font-bold ${styles.text}`}>
              {draw.myTickets !== undefined ? draw.myTickets : draw.entryCount}
            </span>
          </div>

          {/* Decorative Barcode */}
          <div className="flex items-center gap-1 h-8">
            {Array.from({ length: 24 }).map((_, i) => {
              const heights = [8, 12, 10, 16, 8, 14, 10, 12, 16, 10, 8, 14, 12, 10, 16, 8, 14, 10, 12, 8, 16, 10, 14, 12];
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${state === "WINNER" ? "bg-white/30" : "bg-white/10"}`}
                  style={{ height: `${heights[i]}px` }}
                />
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center pt-2">
            <span
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold
                ${
                  state === "WINNER"
                    ? "bg-white/20 text-white"
                    : state === "PENDING"
                    ? "bg-amber-500/20 text-amber-300"
                    : state === "ACTIVE"
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-700/50 text-gray-400"
                }
              `}
            >
              {state === "WINNER" && "🎉 Winner"}
              {state === "PENDING" && "⏳ Pending Draw"}
              {state === "ACTIVE" && "✨ Active"}
              {state === "NOT_SELECTED" && "Not Selected"}
            </span>
          </div>
        </div>

        {/* Film Strip Sprocket Holes */}
        <div className="absolute top-0 left-2 bottom-0 w-4 flex flex-col justify-around">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`left-${i}`}
              className={`w-2 h-2 rounded-full ${state === "WINNER" ? "bg-white/20" : "bg-white/5"}`}
            />
          ))}
        </div>
        <div className="absolute top-0 right-2 bottom-0 w-4 flex flex-col justify-around">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`right-${i}`}
              className={`w-2 h-2 rounded-full ${state === "WINNER" ? "bg-white/20" : "bg-white/5"}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
