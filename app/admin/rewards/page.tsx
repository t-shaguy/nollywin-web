"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, CheckCircle, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  getRewardDraws,
  createRewardDraw,
  closeRewardDraw,
  getRewardDrawById,
  selectDrawWinners,
  getDrawWinners,
  getLeaderboardPrizes,
  setLeaderboardPrize,
  type RewardDraw,
  type CreateRewardDrawRequest,
  type LeaderboardPrize,
} from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTableWrapper } from "@/components/admin/admin-table-wrapper";

interface CreateDrawForm {
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string;
  maxWinners: number;
  status: string;
}

interface LeaderboardPrizeForm {
  rank: number;
  prizeAmount: number;
}

export default function AdminRewardsPage() {
  const [draws, setDraws] = useState<RewardDraw[]>([]);
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [drawDetail, setDrawDetail] = useState<RewardDraw | null>(null);
  const [drawWinners, setDrawWinners] = useState<Record<string, unknown>[]>([]);
  const [leaderboardPrizes, setLeaderboardPrizes] = useState<LeaderboardPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingDrawId, setClosingDrawId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDrawForm>({
    defaultValues: {
      status: "OPEN",
      maxWinners: 1,
    },
  });
  
  const { register: registerPrize, handleSubmit: handleSubmitPrize, reset: resetPrize, formState: { errors: errorsPrize } } = useForm<LeaderboardPrizeForm>();

  useEffect(() => {
    loadDraws();
    loadLeaderboardPrizes();
  }, []);

  async function loadDraws() {
    try {
      setLoading(true);
      setError(null);
      const data = await getRewardDraws();
      setDraws(data);
    } catch (err) {
      console.error("Error loading reward draws:", err);
      setError(err instanceof Error ? err.message : "Failed to load reward draws");
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboardPrizes() {
    try {
      const data = await getLeaderboardPrizes();
      setLeaderboardPrizes(data);
    } catch (err) {
      console.error("Error loading leaderboard prizes:", err);
      // Don't set error - this is optional
    }
  }

  const handleCreateDraw = async (data: CreateDrawForm) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreateRewardDrawRequest = {
        prizeName: data.prizeName,
        ticketCostTokens: data.ticketCostTokens,
        scheduleLabel: data.scheduleLabel,
        maxWinners: data.maxWinners,
        status: data.status,
      };

      const response = await createRewardDraw(payload);
      setSuccessMessage(response.message || "Reward draw created and submitted for approval");
      setShowCreateModal(false);
      reset();
      
      // Note: Do NOT add to local state (maker-checker pattern)
    } catch (err) {
      console.error("Error creating reward draw:", err);
      setError(err instanceof Error ? err.message : "Failed to create reward draw");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDraw = async (drawId: string) => {
    if (!confirm("Are you sure you want to close this draw and select winners?")) {
      return;
    }

    try {
      setClosingDrawId(drawId);
      setError(null);
      setSuccessMessage(null);

      await closeRewardDraw(drawId);
      setSuccessMessage("Draw closed and winners selected successfully");
      
      // Reload draws to see updated status
      await loadDraws();
    } catch (err) {
      console.error("Error closing draw:", err);
      setError(err instanceof Error ? err.message : "Failed to close draw");
    } finally {
      setClosingDrawId(null);
    }
  };

  const handleViewDraw = async (drawId: string) => {
    try {
      setDetailLoading(true);
      setSelectedDrawId(drawId);
      setError(null);
      
      const [detail, winners] = await Promise.all([
        getRewardDrawById(drawId),
        getDrawWinners(drawId).catch(() => []), // May not exist yet
      ]);
      
      setDrawDetail(detail);
      setDrawWinners(winners);
    } catch (err) {
      console.error("Error loading draw detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load draw details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectWinners = async (drawId: string) => {
    if (!confirm("Manually trigger winner selection for this draw?")) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      await selectDrawWinners(drawId);
      setSuccessMessage("Winners selected successfully");
      
      // Reload detail
      if (selectedDrawId === drawId) {
        await handleViewDraw(drawId);
      }
      await loadDraws();
    } catch (err) {
      console.error("Error selecting winners:", err);
      setError(err instanceof Error ? err.message : "Failed to select winners");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetLeaderboardPrize = async (data: LeaderboardPrizeForm) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await setLeaderboardPrize(data.rank, data.prizeAmount);
      setSuccessMessage(response.message || "Leaderboard prize set successfully");
      resetPrize();
      
      // Reload prizes after successful set
      await loadLeaderboardPrizes();
    } catch (err) {
      console.error("Error setting leaderboard prize:", err);
      setError(err instanceof Error ? err.message : "Failed to set leaderboard prize");
    } finally {
      setSubmitting(false);
    }
  };

  // Draw detail view
  if (selectedDrawId) {
    if (detailLoading) {
      return (
        <div className="space-y-6">
          <AdminPageHeader title="Draw Details" />
          <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading draw details...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AdminActionButton variant="secondary" onClick={() => setSelectedDrawId(null)} icon={ArrowLeft} size="sm">
            Back
          </AdminActionButton>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Draw Details</h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3 text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Draw Info */}
          <AdminCard title="Draw Information" className="lg:col-span-2">
            {drawDetail ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Prize Name</span>
                  <span className="font-medium">{drawDetail.prizeName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium px-2.5 py-1 rounded-full text-xs ${
                    drawDetail.status === "ACTIVE" 
                      ? "bg-green-500/10 border border-green-500/30 text-green-600"
                      : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600"
                  }`}>
                    {drawDetail.status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Ticket Cost</span>
                  <span className="font-medium">{drawDetail.ticketCostTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-medium">{drawDetail.scheduleLabel}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Entry Count</span>
                  <span className="font-medium">{drawDetail.entryCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Max Winners</span>
                  <span className="font-medium">{drawDetail.maxWinners}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Winners Selected</span>
                  <span className="font-medium">{drawDetail.winnersSelected ? "Yes" : "No"}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No details available</p>
            )}
          </AdminCard>

          {/* Actions */}
          <AdminCard title="Actions">
            <AdminActionButton
              onClick={() => handleSelectWinners(selectedDrawId)}
              disabled={submitting}
              size="md"
              className="w-full"
            >
              {submitting ? "Selecting..." : "Select Winners"}
            </AdminActionButton>
          </AdminCard>
        </div>

        {/* Winners List */}
        <AdminCard title="Winners">
          {drawWinners.length > 0 ? (
            <div className="space-y-2">
              {drawWinners.map((winner, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-secondary/30 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    {Object.entries(winner).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">No winners selected yet</p>
          )}
        </AdminCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Rewards" />
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading reward draws...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Rewards" 
        description="Manage raffle draws and prizes"
        action={
          <AdminActionButton icon={Plus} onClick={() => setShowCreateModal(true)} size="md">
            Create Draw
          </AdminActionButton>
        }
      />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Leaderboard Prize Form */}
      <AdminCard title="Leaderboard Prizes">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-primary" />
          <h3 className="font-semibold">Configure Prizes</h3>
        </div>
        {/* Current Prizes Table */}
        {leaderboardPrizes.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium mb-3">Current Prizes</h3>
            <AdminTableWrapper>
              <table className="w-full">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Rank</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Prize Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardPrizes.map((prize) => (
                    <tr key={prize.rank} className="border-t border-border/50">
                      <td className="py-2 px-3 text-xs sm:text-sm font-medium">#{prize.rank}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-right">
                        ₦{(prize.prizeAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableWrapper>
          </div>
        )}
        
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Configure prize amounts for specific leaderboard ranks.
          {leaderboardPrizes.length === 0 && (
            <>
              <br />
              <strong className="text-yellow-600">Note:</strong> No prizes configured yet. Use the form below to add prizes.
            </>
          )}
        </p>
        <form onSubmit={handleSubmitPrize(handleSetLeaderboardPrize)} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="number"
              {...registerPrize("rank", { 
                required: "Rank is required", 
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" }
              })}
              placeholder="Rank (e.g. 1)"
              className="text-sm"
            />
            {errorsPrize.rank && <p className="text-destructive text-xs mt-1">{errorsPrize.rank.message}</p>}
          </div>
          <div className="flex-1">
            <Input
              type="number"
              {...registerPrize("prizeAmount", { 
                required: "Amount is required", 
                valueAsNumber: true,
                min: { value: 0, message: "Must be 0 or greater" }
              })}
              placeholder="Prize amount (kobo)"
              className="text-sm"
            />
            {errorsPrize.prizeAmount && <p className="text-destructive text-xs mt-1">{errorsPrize.prizeAmount.message}</p>}
          </div>
          <AdminActionButton type="submit" disabled={submitting} size="md">
            {submitting ? "Setting..." : "Set Prize"}
          </AdminActionButton>
        </form>
      </AdminCard>

      {/* Reward Draws */}
      {draws.length === 0 && !loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          No reward draws yet. Create your first draw to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {draws.map((draw) => (
            <div 
              key={draw.id} 
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleViewDraw(draw.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg">{draw.prizeName}</h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  draw.status === "ACTIVE" 
                    ? "bg-green-500/10 border border-green-500/30 text-green-600"
                    : draw.status === "CLOSED"
                    ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600"
                    : "bg-blue-500/10 border border-blue-500/30 text-blue-600"
                }`}>
                  {draw.status}
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-medium">{draw.scheduleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Cost</span>
                  <span className="font-medium">{draw.ticketCostTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries</span>
                  <span className="font-medium">{draw.entryCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Winners</span>
                  <span className="font-medium">{draw.maxWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winners Selected</span>
                  <span className="font-medium">{draw.winnersSelected ? "Yes" : "No"}</span>
                </div>
              </div>

              {draw.status === "ACTIVE" && (
                <AdminActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseDraw(draw.id);
                  }}
                  disabled={closingDrawId === draw.id}
                  variant="danger"
                  size="sm"
                  className="w-full"
                >
                  {closingDrawId === draw.id ? "Closing..." : "Close & Select Winners"}
                </AdminActionButton>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Draw Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError(null);
        }}
        title="Create New Reward Draw"
      >
        <form onSubmit={handleSubmit(handleCreateDraw)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prize Name</label>
            <Input
              {...register("prizeName", { required: "Prize name is required" })}
              placeholder="e.g. Samsung Galaxy S24"
            />
            {errors.prizeName && <p className="text-destructive text-sm mt-1">{errors.prizeName.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ticket Cost (tokens)</label>
            <Input
              type="number"
              {...register("ticketCostTokens", { 
                required: "Ticket cost is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              placeholder="5000"
            />
            {errors.ticketCostTokens && <p className="text-destructive text-sm mt-1">{errors.ticketCostTokens.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Schedule Label</label>
            <select
              {...register("scheduleLabel", { required: "Schedule is required" })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
            >
              <option value="">Select schedule</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
            {errors.scheduleLabel && <p className="text-destructive text-sm mt-1">{errors.scheduleLabel.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Max Winners</label>
            <Input
              type="number"
              {...register("maxWinners", { 
                required: "Max winners is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              placeholder="1"
            />
            {errors.maxWinners && <p className="text-destructive text-sm mt-1">{errors.maxWinners.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Initial Status</label>
            <select
              {...register("status", { required: "Status is required" })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            {errors.status && <p className="text-destructive text-sm mt-1">{errors.status.message}</p>}
          </div>

          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
