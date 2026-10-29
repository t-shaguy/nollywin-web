"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, CheckCircle, ArrowLeft, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminModal, ModalSection, FormGrid, ModalFooter } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminInput, AdminSelect } from "@/components/admin/admin-field";
import { StatusBadge, CountPill } from "@/components/admin/status-badge";
import {
  getRewardDraws,
  createRewardDraw,
  closeRewardDraw,
  getRewardDrawById,
  selectDrawWinners,
  getDrawWinners,
  setLeaderboardPrize,
  getLeaderboardPrizes,
  type RewardDraw,
  type CreateRewardDrawRequest,
} from "@/lib/api/admin";
import { getDrawActions, getDrawStatusMessage } from "@/lib/utils/draw-actions";
import { pluralize } from "@/lib/utils/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminCard } from "@/components/admin/admin-card";
import { cn } from "@/lib/utils";

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
  const [leaderboardPrizes, setLeaderboardPrizes] = useState<Array<{ rank: number; prizeAmount: number }>>([]);
  const [prizesLoading, setPrizesLoading] = useState(false);
  const [prizesError, setPrizesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Confirmation dialogs
  const [showCloseDrawDialog, setShowCloseDrawDialog] = useState(false);
  const [showSelectWinnersDialog, setShowSelectWinnersDialog] = useState(false);
  const [drawToClose, setDrawToClose] = useState<string | null>(null);
  const [drawToSelectWinners, setDrawToSelectWinners] = useState<string | null>(null);

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

  async function loadLeaderboardPrizes() {
    try {
      setPrizesLoading(true);
      setPrizesError(null);
      const prizes = await getLeaderboardPrizes();
      setLeaderboardPrizes(prizes.sort((a, b) => a.rank - b.rank));
    } catch (err) {
      console.error("Error loading leaderboard prizes:", err);
      setPrizesError(err instanceof Error ? err.message : "Failed to load prizes");
    } finally {
      setPrizesLoading(false);
    }
  }

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
    } catch (err) {
      console.error("Error creating reward draw:", err);
      setError(err instanceof Error ? err.message : "Failed to create reward draw");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDraw = async (drawId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await closeRewardDraw(drawId);
      setSuccessMessage(response.message || "Draw close submitted for approval");
      await loadDraws();
      
      // Reload detail if viewing this draw
      if (selectedDrawId === drawId) {
        await handleViewDraw(drawId);
      }
      
      setShowCloseDrawDialog(false);
      setDrawToClose(null);
    } catch (err) {
      console.error("Error closing draw:", err);
      setError(err instanceof Error ? err.message : "Failed to close draw");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDraw = async (drawId: string) => {
    try {
      setDetailLoading(true);
      setSelectedDrawId(drawId);
      setError(null);
      
      const [detail, winners] = await Promise.all([
        getRewardDrawById(drawId),
        getDrawWinners(drawId).catch(() => []),
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
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await selectDrawWinners(drawId);
      setSuccessMessage(response.message || "Winner selection submitted for approval");
      
      await loadDraws();
      if (selectedDrawId === drawId) {
        await handleViewDraw(drawId);
      }
      
      setShowSelectWinnersDialog(false);
      setDrawToSelectWinners(null);
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
      setSuccessMessage(response.message || "Leaderboard prize set and submitted for approval");
      resetPrize();
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
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => setSelectedDrawId(null)}>
              Back
            </Button>
            <h1 className="text-xl font-semibold">Draw Details</h1>
          </div>
          <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center">
            <div className="text-muted-foreground text-[13px]">Loading draw details...</div>
          </div>
        </div>
      );
    }

    if (!drawDetail) {
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => setSelectedDrawId(null)}>
              Back
            </Button>
            <h1 className="text-xl font-semibold">Draw Details</h1>
          </div>
          <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center">
            <div className="text-muted-foreground text-[13px]">Draw not found</div>
          </div>
        </div>
      );
    }

    // Get actions for this draw
    const actions = getDrawActions(drawDetail, {
      onCloseAndSelectWinners: () => {
        setDrawToClose(drawDetail.id);
        setShowCloseDrawDialog(true);
      },
      onSelectWinners: () => {
        setDrawToSelectWinners(drawDetail.id);
        setShowSelectWinnersDialog(true);
      },
    });

    const statusMessage = getDrawStatusMessage(drawDetail);

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            icon={<ArrowLeft size={16} strokeWidth={1.5} />}
            onClick={() => setSelectedDrawId(null)}
          >
            Back
          </Button>
          <h1 className="text-xl font-semibold">{drawDetail.prizeName}</h1>
          <StatusBadge status={drawDetail.status} />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg p-4 text-[var(--success)] flex items-start gap-3 text-[13px]">
            <CheckCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-xs mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Draw Info */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Draw Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <div className="text-muted-foreground mb-1">Prize Name</div>
                <div className="font-medium">{drawDetail.prizeName}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Status</div>
                <div><StatusBadge status={drawDetail.status} /></div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Ticket Cost</div>
                <div className="font-medium">{pluralize(drawDetail.ticketCostTokens, "token", "tokens")}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Schedule</div>
                <div className="font-medium">{drawDetail.scheduleLabel}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Entry Count</div>
                <div className="font-medium">{drawDetail.entryCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Max Winners</div>
                <div className="font-medium">{drawDetail.maxWinners}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Winners Selected</div>
                <div className="font-medium">{drawDetail.winnersSelected ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>

          {/* Actions or Status Message */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Actions</h3>
            {statusMessage?.show ? (
              <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg text-[13px] text-muted-foreground">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                <p>{statusMessage.message}</p>
              </div>
            ) : actions.length > 0 ? (
              <div className="space-y-2">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant}
                    size="md"
                    onClick={action.onClick}
                    disabled={action.disabled || submitting}
                    loading={submitting}
                    className="w-full justify-center"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">No actions available</p>
            )}
          </div>
        </div>

        {/* Winners */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Winners</h3>
          {drawWinners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Selected At</th>
                    {drawWinners.some(w => w.userId || w.user_id) && (
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">User ID</th>
                    )}
                    {drawWinners.some(w => w.entryId || w.entry_id) && (
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Entry ID</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {drawWinners.map((winner, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-3">{String(winner.email || winner.userEmail || "-")}</td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {winner.selectedAt || winner.selected_at 
                          ? new Date(String(winner.selectedAt || winner.selected_at)).toLocaleString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : "-"}
                      </td>
                      {drawWinners.some(w => w.userId || w.user_id) && (
                        <td className="py-3 px-3 font-mono text-xs">{String(winner.userId || winner.user_id || "-")}</td>
                      )}
                      {drawWinners.some(w => w.entryId || w.entry_id) && (
                        <td className="py-3 px-3 font-mono text-xs">{String(winner.entryId || winner.entry_id || "-")}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-[13px]">No winners selected yet</p>
          )}
        </div>

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={showCloseDrawDialog}
          onClose={() => {
            setShowCloseDrawDialog(false);
            setDrawToClose(null);
          }}
          onConfirm={() => drawToClose && handleCloseDraw(drawToClose)}
          title="Close Draw & Select Winners"
          description="Are you sure you want to close this draw and select winners? This action will be submitted for approval."
          confirmLabel="Yes, Close Draw"
          variant="danger"
          loading={submitting}
        />

        <ConfirmDialog
          open={showSelectWinnersDialog}
          onClose={() => {
            setShowSelectWinnersDialog(false);
            setDrawToSelectWinners(null);
          }}
          onConfirm={() => drawToSelectWinners && handleSelectWinners(drawToSelectWinners)}
          title="Select Winners"
          description="Manually trigger winner selection for this draw? This action will be submitted for approval."
          confirmLabel="Select Winners"
          variant="primary"
          loading={submitting}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Rewards</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage raffle draws and prizes</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-[13px]">Loading reward draws...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Rewards</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage raffle draws and prizes</p>
        </div>
        <Button
          variant="gradient"
          size="md"
          icon={<Plus size={16} strokeWidth={1.5} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Draw
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg p-4 text-[var(--success)] flex items-start gap-3 text-[13px]">
          <CheckCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-xs mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px]">
          {error}
        </div>
      )}

      {/* Leaderboard Prizes */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} strokeWidth={1.5} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Leaderboard Prizes</h3>
        </div>
        
        {prizesLoading ? (
          <div className="mb-4 p-4 bg-secondary/30 rounded-lg text-center text-[13px] text-muted-foreground">
            Loading current prizes...
          </div>
        ) : prizesError ? (
          <div className="mb-4 p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg text-[13px] text-[var(--danger)]">
            {prizesError}
          </div>
        ) : leaderboardPrizes.length > 0 ? (
          <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Current Prizes</p>
            <div className="space-y-2">
              {leaderboardPrizes.map((prize) => (
                <div key={prize.rank} className="flex items-center justify-between text-[13px] py-1">
                  <span className="font-medium">#{prize.rank}</span>
                  <span className="font-bold text-primary">₦{prize.prizeAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-secondary/30 rounded-lg text-center text-[13px] text-muted-foreground">
            No prizes configured yet
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mb-4">
          Configure prize amounts for specific leaderboard ranks.
        </p>
        <form onSubmit={handleSubmitPrize(handleSetLeaderboardPrize)} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <AdminInput
              type="number"
              {...registerPrize("rank", { 
                required: "Rank is required", 
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" }
              })}
              placeholder="Rank (e.g. 1)"
              error={errorsPrize.rank?.message}
            />
          </div>
          <div className="flex-1">
            <AdminInput
              type="number"
              {...registerPrize("prizeAmount", { 
                required: "Amount is required", 
                valueAsNumber: true,
                min: { value: 0, message: "Must be 0 or greater" }
              })}
              placeholder="Prize amount (kobo)"
              error={errorsPrize.prizeAmount?.message}
            />
          </div>
          <Button type="submit" variant="gradient" size="md" disabled={submitting} loading={submitting}>
            Set Prize
          </Button>
        </form>
      </div>

      {/* Draws Grid */}
      {draws.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
          No reward draws yet. Create your first draw to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {draws.map((draw) => {
            const actions = getDrawActions(draw, {
              onCloseAndSelectWinners: () => {
                setDrawToClose(draw.id);
                setShowCloseDrawDialog(true);
              },
              onSelectWinners: () => {
                setDrawToSelectWinners(draw.id);
                setShowSelectWinnersDialog(true);
              },
            });

            return (
              <div
                key={draw.id}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleViewDraw(draw.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm">{draw.prizeName}</h3>
                  <StatusBadge status={draw.status} />
                </div>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule</span>
                    <span className="font-medium">{draw.scheduleLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Cost</span>
                    <span className="font-medium">{pluralize(draw.ticketCostTokens, "token", "tokens")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entries</span>
                    <span className="font-medium">{draw.entryCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winners Selected</span>
                    <span className="font-medium">{draw.winnersSelected ? "Yes" : "No"}</span>
                  </div>
                </div>

                {actions.length > 0 && (
                  <Button
                    variant={actions[0].variant}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions[0].onClick();
                    }}
                    disabled={actions[0].disabled}
                    className="w-full justify-center"
                  >
                    {actions[0].label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Draw Modal */}
      <AdminModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError(null);
        }}
        title="Create New Reward Draw"
        description="Set up a new raffle draw for rewards"
        size="md"
        footer={
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="md"
              onClick={handleSubmit(handleCreateDraw)}
              loading={submitting}
            >
              Submit for Approval
            </Button>
          </ModalFooter>
        }
      >
        <form onSubmit={handleSubmit(handleCreateDraw)} className="space-y-4">
          <AdminInput
            label="Prize Name"
            {...register("prizeName", { required: "Prize name is required" })}
            placeholder="e.g. Samsung Galaxy S24"
            error={errors.prizeName?.message}
          />

          <FormGrid>
            <AdminInput
              label="Ticket Cost (tokens)"
              type="number"
              {...register("ticketCostTokens", { 
                required: "Ticket cost is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              placeholder="5000"
              error={errors.ticketCostTokens?.message}
            />

            <AdminInput
              label="Max Winners"
              type="number"
              {...register("maxWinners", { 
                required: "Max winners is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              placeholder="1"
              error={errors.maxWinners?.message}
            />
          </FormGrid>

          <AdminSelect
            label="Schedule Label"
            {...register("scheduleLabel", { required: "Schedule is required" })}
            options={[
              { value: "", label: "Select schedule" },
              { value: "Daily", label: "Daily" },
              { value: "Weekly", label: "Weekly" },
              { value: "Monthly", label: "Monthly" },
            ]}
            error={errors.scheduleLabel?.message}
          />

          <AdminSelect
            label="Initial Status"
            {...register("status", { required: "Status is required" })}
            options={[
              { value: "OPEN", label: "Open" },
              { value: "CLOSED", label: "Closed" },
            ]}
            error={errors.status?.message}
          />
        </form>
      </AdminModal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showCloseDrawDialog}
        onClose={() => {
          setShowCloseDrawDialog(false);
          setDrawToClose(null);
        }}
        onConfirm={() => drawToClose && handleCloseDraw(drawToClose)}
        title="Close Draw & Select Winners"
        description="Are you sure you want to close this draw and select winners? This action will be submitted for approval."
        confirmLabel="Yes, Close Draw"
        variant="danger"
        loading={submitting}
      />

      <ConfirmDialog
        open={showSelectWinnersDialog}
        onClose={() => {
          setShowSelectWinnersDialog(false);
          setDrawToSelectWinners(null);
        }}
        onConfirm={() => drawToSelectWinners && handleSelectWinners(drawToSelectWinners)}
        title="Select Winners"
        description="Manually trigger winner selection for this draw? This action will be submitted for approval."
        confirmLabel="Select Winners"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
}
