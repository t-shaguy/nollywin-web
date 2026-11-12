"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActiveDrawCard } from "../../features/raffles/presentation/active-draw-card";
import { RaffleHistoryList } from "../../features/raffles/presentation/raffle-history-list";
import { DrawCountdownModal } from "@/components/ui/draw-countdown-modal";
import { getActiveDraws } from "@/lib/api/leaderboard";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { type RaffleDraw } from "@/lib/api/leaderboard";
import { SHOW_ACTIVE_DRAWS } from "@/lib/config/features";

type TabType = "active" | "history";

export default function RafflesPage() {
  const [activeTab, setActiveTab] = useState<TabType>(SHOW_ACTIVE_DRAWS ? "active" : "history");
  const [selectedDraw, setSelectedDraw] = useState<RaffleDraw | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasShownAutoModal, setHasShownAutoModal] = useState(false);

  // Fetch dashboard for subscription status and active raffles with points
  const { data: dashboard } = usePlayerDashboard();

  // Fetch active draws (only if feature enabled)
  const { data: draws = [], isLoading } = useQuery({
    queryKey: ["draws", "active"],
    queryFn: getActiveDraws,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: "always", // Refetch when component mounts
    enabled: SHOW_ACTIVE_DRAWS, // Only fetch when feature is enabled
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

  // Auto-show modal for nearest draw (once per session) - only if feature enabled
  useEffect(() => {
    if (!SHOW_ACTIVE_DRAWS || hasShownAutoModal || activeDraws.length === 0 || !dashboard?.activeRaffles) return;

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
        
        // Prepare draw with points
        const drawWithPoints: RaffleDraw = {
          ...nearest,
          myPoints: raffleData?.myPoints ?? nearest.myPoints ?? 0,
        };
        
        // Use setTimeout to avoid cascading renders
        setTimeout(() => {
          setSelectedDraw(drawWithPoints);
          setShowModal(true);
          setHasShownAutoModal(true);
        }, 0);
        
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
        <h1 className="text-xl sm:text-2xl font-bold">Draws</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Score points in games to win prizes in our draws.</p>
      </div>

      {/* Tabs - only show if feature enabled */}
      {SHOW_ACTIVE_DRAWS && (
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
      )}

      {/* Tab Content */}
      {SHOW_ACTIVE_DRAWS && activeTab === "active" && (
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
                    tokensLeft={dashboard?.tokensLeft ?? null}
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

      {(!SHOW_ACTIVE_DRAWS || activeTab === "history") && (
        <>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold">History</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Draws you've taken part in</p>
          </div>
          <RaffleHistoryList />
        </>
      )}

      {/* Countdown Modal - only if feature enabled */}
      {SHOW_ACTIVE_DRAWS && selectedDraw && selectedDraw.drawDate && selectedDraw.startsOn && selectedDraw.endsOn && (
        <DrawCountdownModal
          isOpen={showModal}
          onClose={handleCloseModal}
          drawDate={selectedDraw.drawDate}
          prizeName={selectedDraw.prizeName}
          startsOn={selectedDraw.startsOn}
          endsOn={selectedDraw.endsOn}
          myPoints={selectedDraw.myPoints ?? 0}
        />
      )}
    </div>
  );
}
