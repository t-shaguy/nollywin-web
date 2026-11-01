"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActiveDrawCard } from "../../features/raffles/presentation/active-draw-card";
import { RaffleHistoryList } from "../../features/raffles/presentation/raffle-history-list";
import { DrawCountdownModal } from "@/components/ui/draw-countdown-modal";
import { getActiveDraws } from "@/lib/api/leaderboard";
import { getPlayerDashboard } from "@/lib/api/auth";

type TabType = "active" | "history";

export default function RafflesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [selectedDraw, setSelectedDraw] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasShownAutoModal, setHasShownAutoModal] = useState(false);

  // Fetch dashboard for subscription status and active raffles with points
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getPlayerDashboard,
  });

  // Fetch active draws
  const { data: draws = [], isLoading } = useQuery({
    queryKey: ["draws", "active"],
    queryFn: getActiveDraws,
  });

  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;
  const activeDraws = draws.filter((d) => d.status === "ACTIVE");

  // Auto-show modal for nearest draw (once per session)
  useEffect(() => {
    if (hasShownAutoModal || activeDraws.length === 0 || !dashboard?.activeRaffles) return;

    try {
      const sessionKey = "nollywin-draw-modal-shown";
      const shown = sessionStorage.getItem(sessionKey);
      
      if (!shown && activeDraws.length > 0) {
        // Find nearest draw by date (null-safe)
        const nearest = activeDraws
          .filter((d) => d.drawDate != null)
          .reduce((prev, curr) => {
            if (!prev.drawDate) return curr;
            if (!curr.drawDate) return prev;
            const prevDate = new Date(prev.drawDate).getTime();
            const currDate = new Date(curr.drawDate).getTime();
            return currDate < prevDate ? curr : prev;
          });

        // Get user points for this draw
        const raffleData = dashboard.activeRaffles.find(r => r.raffleCode === nearest.raffleCode);
        
        setSelectedDraw({
          ...nearest,
          myPoints: raffleData?.myPoints ?? 0,
        });
        setShowModal(true);
        setHasShownAutoModal(true);
        sessionStorage.setItem(sessionKey, "true");
      }
    } catch (err) {
      // Silently fail if sessionStorage not available
      console.warn("Session storage not available:", err);
    }
  }, [activeDraws, dashboard, hasShownAutoModal]);

  const handleDrawClick = (draw: any) => {
    // Get user points for this draw
    const raffleData = dashboard?.activeRaffles?.find(r => r.raffleCode === draw.raffleCode);
    setSelectedDraw({
      ...draw,
      myPoints: raffleData?.myPoints ?? 0,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDraw(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Draws & Rewards</h1>
        <p className="text-muted-foreground text-sm mt-1">Score points in games to win prizes in our draws.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Draws
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "active" && (
        <>
          {isLoading ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
              Loading draws...
            </div>
          ) : activeDraws.length > 0 ? (
            <div className="space-y-6">
              {activeDraws.map((draw) => {
                const raffleData = dashboard?.activeRaffles?.find(r => r.raffleCode === draw.raffleCode);
                const myPoints = raffleData?.myPoints ?? 0;

                return (
                  <ActiveDrawCard
                    key={draw.id}
                    draw={draw}
                    onShowCountdown={() => handleDrawClick(draw)}
                    hasActiveSubscription={hasActiveSubscription}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
              No active draws right now — check back soon.
            </div>
          )}
        </>
      )}

      {activeTab === "history" && <RaffleHistoryList />}

      {/* Countdown Modal */}
      {selectedDraw && (
        <DrawCountdownModal
          isOpen={showModal}
          onClose={handleCloseModal}
          drawDate={selectedDraw.drawDate}
          prizeName={selectedDraw.prizeName}
          startsOn={selectedDraw.startsOn}
          endsOn={selectedDraw.endsOn}
          myPoints={selectedDraw.myPoints}
          raffleCode={selectedDraw.raffleCode}
        />
      )}
    </div>
  );
}
