"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActiveDrawCard } from "../../features/raffles/presentation/active-draw-card";
import { RaffleHistoryList } from "../../features/raffles/presentation/raffle-history-list";
import { DrawCountdownModal } from "@/components/ui/draw-countdown-modal";
import { getActiveDraws } from "@/lib/api/leaderboard";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { type RaffleDraw } from "@/lib/api/leaderboard";

type TabType = "active" | "history";

export default function RafflesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [selectedDraw, setSelectedDraw] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasShownAutoModal, setHasShownAutoModal] = useState(false);

  // Fetch dashboard for subscription status and active raffles with points
  const { data: dashboard } = usePlayerDashboard();

  // Fetch active draws
  const { data: draws = [], isLoading } = useQuery({
    queryKey: ["draws", "active"],
    queryFn: getActiveDraws,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: "always", // Refetch when component mounts
  });

  // TEMP DEV LOGGING: Check data sources (remove after verification)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && dashboard && draws.length > 0) {
      console.log('[RAFFLES DEBUG] Dashboard activeRaffles:', dashboard.activeRaffles);
      console.log('[RAFFLES DEBUG] Active draws:', draws);
      
      // Find Samsung Test draw in both sources
      const samsungDashboard = dashboard.activeRaffles?.find(r => r.prizeName.includes('Samsung'));
      const samsungDraw = draws.find(d => d.prizeName.includes('Samsung'));
      
      if (samsungDashboard) {
        console.log('[RAFFLES DEBUG] Samsung from dashboard:', {
          id: samsungDashboard.id,
          myPoints: samsungDashboard.myPoints,
          entered: samsungDashboard.entered,
          myTickets: samsungDashboard.myTickets,
        });
      }
      
      if (samsungDraw) {
        console.log('[RAFFLES DEBUG] Samsung from /draws/active:', {
          id: samsungDraw.id,
          myPoints: samsungDraw.myPoints,
          entered: samsungDraw.entered,
          myTickets: samsungDraw.myTickets,
        });
      }
    }
  }, [dashboard, draws]);

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

        // Get user points for this draw from dashboard (verified source)
        const raffleData = dashboard.activeRaffles.find(r => r.id === nearest.id);
        
        setSelectedDraw({
          ...nearest,
          myPoints: raffleData?.myPoints ?? nearest.myPoints ?? 0,
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

  const handleDrawClick = (draw: RaffleDraw) => {
    // Get user points for this draw from dashboard (verified source)
    const raffleData = dashboard?.activeRaffles?.find(r => r.id === draw.id);
    setSelectedDraw({
      ...draw,
      myPoints: raffleData?.myPoints ?? draw.myPoints ?? 0,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDraw(null);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Draws & Rewards</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Score points in games to win prizes in our draws.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Draws
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
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
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center text-xs sm:text-sm text-muted-foreground">
              Loading draws...
            </div>
          ) : activeDraws.length > 0 ? (
            <div className="space-y-5 md:space-y-6">
              {activeDraws.map((draw) => {
                // CRITICAL FIX: Merge dashboard data (verified source for myPoints/entered) with draw data
                // Dashboard activeRaffles has the user's actual points, /draws/active may not
                const raffleData = dashboard?.activeRaffles?.find(r => r.id === draw.id);
                
                // Create enriched draw with user data from dashboard
                const enrichedDraw: RaffleDraw = {
                  ...draw,
                  // Use dashboard data if available (verified source), fallback to draw data
                  myPoints: raffleData?.myPoints ?? draw.myPoints ?? null,
                  entered: raffleData?.entered ?? draw.entered ?? false,
                  myTickets: raffleData?.myTickets ?? draw.myTickets,
                };

                return (
                  <ActiveDrawCard
                    key={draw.id}
                    draw={enrichedDraw}
                    onShowCountdown={() => handleDrawClick(enrichedDraw)}
                    hasActiveSubscription={hasActiveSubscription}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center text-xs sm:text-sm text-muted-foreground">
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
