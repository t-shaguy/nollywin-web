"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, CheckCircle, ArrowLeft, AlertCircle, Users, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminModal, ModalSection, FormGrid, ModalFooter } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminInput } from "@/components/admin/admin-field";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  getAdminDraws,
  getAdminDraw,
  createDraw,
  closeDraw,
  getDrawStandings,
  selectDrawWinners,
  getDrawWinners,
  type AdminDrawDetails,
  type CreateDrawRequest,
  type DrawStandingsEntry,
  type DrawWinner,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "detail" | "standings" | "winners";

interface CreateDrawForm {
  prizeName: string;
  scheduleLabel: string;
  startsOn: string;
  endsOn: string;
  drawDate: string;
  maxWinners: number;
  tiers: {
    position: number;
    tierName: string;
    prizeName: string;
    winnersCount: number;
  }[];
}

// Helper: format UTC date as "DD MMM YYYY"
function formatDrawDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return "-";
  }
}

// Helper: get projected tier for a rank
function getProjectedTier(rank: number, tiers: { position: number; tierName: string; winnersCount: number }[]): string | null {
  if (!tiers || tiers.length === 0) return null;
  
  const sortedTiers = [...tiers].sort((a, b) => a.position - b.position);
  let cumulativeWinners = 0;
  
  for (const tier of sortedTiers) {
    cumulativeWinners += tier.winnersCount;
    if (rank <= cumulativeWinners) {
      return tier.tierName;
    }
  }
  
  return null;
}

export default function AdminRewardsPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [draws, setDraws] = useState<AdminDrawDetails[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<AdminDrawDetails | null>(null);
  const [standings, setStandings] = useState<DrawStandingsEntry[]>([]);
  const [winners, setWinners] = useState<DrawWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showSelectWinnersDialog, setShowSelectWinnersDialog] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Form
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<CreateDrawForm>({
    defaultValues: {
      maxWinners: 1,
      tiers: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tiers",
  });

  const tiers = watch("tiers");
  const useTiers = fields.length > 0;

  // Auto-calculate maxWinners from tiers
  useEffect(() => {
    if (useTiers && (tiers ?? []).length > 0) {
      const sum = (tiers ?? []).reduce((acc, tier) => acc + (tier.winnersCount || 0), 0);
      setValue("maxWinners", sum);
    }
  }, [tiers, useTiers, setValue]);

  useEffect(() => {
    loadDraws();
  }, [statusFilter]);

  async function loadDraws() {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminDraws(statusFilter || undefined);
      setDraws(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error loading draws:", err);
      setError(err instanceof Error ? err.message : "Failed to load draws");
      setDraws([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }

  async function loadDrawDetails(id: string) {
    try {
      setDetailLoading(true);
      setError(null);
      const detail = await getAdminDraw(id);
      setSelectedDraw(detail);
    } catch (err) {
      console.error("Error loading draw details:", err);
      setError(err instanceof Error ? err.message : "Failed to load draw details");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadStandings(id: string) {
    try {
      setDetailLoading(true);
      setError(null);
      const data = await getDrawStandings(id);
      setStandings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading standings:", err);
      setError(err instanceof Error ? err.message : "Failed to load standings");
      setStandings([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadWinners(id: string) {
    try {
      setDetailLoading(true);
      setError(null);
      const data = await getDrawWinners(id);
      setWinners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading winners:", err);
      setError(err instanceof Error ? err.message : "Failed to load winners");
      setWinners([]);
    } finally {
      setDetailLoading(false);
    }
  }

  const handleCreateDraw = async (data: CreateDrawForm) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setResultSummary(null);

      // Date validation
      if (data.endsOn < data.startsOn) {
        setError("End date must be on or after start date");
        return;
      }
      if (data.drawDate < data.endsOn) {
        setError("Draw date must be on or after end date");
        return;
      }

      const payload: CreateDrawRequest = {
        prizeName: data.prizeName,
        scheduleLabel: data.scheduleLabel,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
        drawDate: data.drawDate,
        maxWinners: data.maxWinners,
        prizeTiers: (data.tiers ?? []).length > 0 ? data.tiers : undefined,
      };

      const response = await createDraw(payload);
      setSuccessMessage("Draw created successfully");
      setResultSummary(response.message || "Awaiting approval");
      setShowCreateModal(false);
      reset();
      await loadDraws();
    } catch (err: unknown) {
      console.error("Error creating draw:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create draw");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDraw = async (draw: AdminDrawDetails) => {
    setSelectedDraw(draw);
    setViewMode("detail");
    setError(null);
    setSuccessMessage(null);
    setResultSummary(null);
    await loadDrawDetails(draw.id);
  };

  const handleViewStandings = async () => {
    if (!selectedDraw) return;
    setViewMode("standings");
    setError(null);
    await loadStandings(selectedDraw.id);
  };

  const handleViewWinners = async () => {
    if (!selectedDraw) return;
    setViewMode("winners");
    setError(null);
    await loadWinners(selectedDraw.id);
  };

  const handleCloseDraw = async () => {
    if (!selectedDraw) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setResultSummary(null);

      const response = await closeDraw(selectedDraw.id);
      setSuccessMessage("Draw close request submitted");
      setResultSummary(response.message || "Awaiting approval");
      setShowCloseDialog(false);
      await loadDraws();
      await loadDrawDetails(selectedDraw.id);
    } catch (err: unknown) {
      console.error("Error closing draw:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to close draw");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinners = async () => {
    if (!selectedDraw) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setResultSummary(null);

      const response = await selectDrawWinners(selectedDraw.id);
      setSuccessMessage("Winner selection request submitted");
      setResultSummary(response.message || "Awaiting approval");
      setShowSelectWinnersDialog(false);
      await loadDraws();
      await loadDrawDetails(selectedDraw.id);
    } catch (err: unknown) {
      console.error("Error selecting winners:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to select winners");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backToList = () => {
    setViewMode("list");
    setSelectedDraw(null);
    setStandings([]);
    setWinners([]);
    setError(null);
    setSuccessMessage(null);
    setResultSummary(null);
  };

  const backToDetail = () => {
    setViewMode("detail");
    setStandings([]);
    setWinners([]);
    setError(null);
  };

  // Action matrix based on V37 FINAL spec (ACTIVE/CLOSED only)
  const getActions = (draw: AdminDrawDetails) => {
    const actions: Array<{ label: string; onClick: () => void; variant: "gradient" | "danger"; disabled?: boolean }> = [];
    const today = new Date().toISOString().split("T")[0]; // UTC date
    const isLegacy = draw.endsOn === null;

    // ACTIVE → "Close draw"
    if (draw.status === "ACTIVE") {
      actions.push({
        label: "Close Draw",
        onClick: () => setShowCloseDialog(true),
        variant: "gradient",
      });
    }

    // CLOSED + no winners + today > endsOn (day after) → "Select winners"
    // Legacy draws (null endsOn) allow select
    if (draw.status === "CLOSED" && !draw.winnersSelected) {
      const allowSelect = isLegacy || (draw.endsOn && today > draw.endsOn);
      actions.push({
        label: "Select Winners",
        onClick: () => setShowSelectWinnersDialog(true),
        variant: "gradient",
        disabled: !allowSelect,
      });
    }

    return actions;
  };

  // Render list view
  if (viewMode === "list") {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Rewards</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage points-based raffle draws (V37)</p>
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

        {/* Success Message with Result Summary */}
        {successMessage && (
          <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg p-4 text-[var(--success)] flex items-start gap-3 text-[13px]">
            <CheckCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{successMessage}</p>
              {resultSummary && (
                <p className="text-xs mt-1 opacity-90">{resultSummary}</p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px] flex items-start gap-3">
            <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {["", "ACTIVE", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-colors",
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {status || "All"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            Loading draws...
          </div>
        ) : draws.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            No draws found. Create your first draw to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(draws ?? []).map((draw) => (
              <div
                key={draw.id}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleViewDraw(draw)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{draw.prizeName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{draw.raffleCode}</p>
                  </div>
                  <StatusBadge status={draw.status} />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule</span>
                    <span className="font-medium">{draw.scheduleLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualifying Period</span>
                    <span className="font-medium">
                      {formatDrawDate(draw.startsOn)} - {formatDrawDate(draw.endsOn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Draw Date</span>
                    <span className="font-medium">{formatDrawDate(draw.drawDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entries</span>
                    <span className="font-medium">{(draw.entryCount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winners Selected</span>
                    <span className="font-medium">{draw.winnersSelected ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AdminModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setError(null);
            reset();
          }}
          title="Create New Draw"
          description="V37: Points-based raffle draw with qualifying period"
          size="lg"
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
          <form onSubmit={handleSubmit(handleCreateDraw)} className="space-y-5">
            <ModalSection title="Basic Information">
              <FormGrid>
                <AdminInput
                  label="Prize Name"
                  {...register("prizeName", { required: "Prize name is required" })}
                  placeholder="Samsung Galaxy S24"
                  error={errors.prizeName?.message}
                />
                <AdminInput
                  label="Schedule Label"
                  {...register("scheduleLabel", { required: "Schedule label is required" })}
                  placeholder="Monthly Draw"
                  error={errors.scheduleLabel?.message}
                />
              </FormGrid>
              <p className="text-xs text-muted-foreground mt-1">
                Raffle code will be auto-generated by the backend
              </p>
            </ModalSection>

            <ModalSection title="Dates (UTC)">
              {/* Monthly Schedule Helper */}
              <div className="mb-4 p-4 bg-secondary/30 rounded-lg border border-border">
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  Quick-fill: Monthly draw
                </label>
                <input
                  type="month"
                  className="w-full px-4 py-2.5 text-[13px] rounded-lg border border-border bg-background text-foreground font-medium cursor-pointer hover:border-primary/50 transition-colors [color-scheme:dark]"
                  onChange={(e) => {
                    const monthValue = e.target.value; // Format: YYYY-MM
                    if (!monthValue) return;
                    
                    const [year, month] = monthValue.split("-").map(Number);
                    
                    // Start date: 1st of the month
                    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
                    
                    // End date: last day of the month (handle 28/29/30/31, leap years)
                    const lastDay = new Date(year, month, 0).getDate(); // month is 1-indexed, day=0 gives last day of previous month
                    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                    
                    // Draw date: 1st of the next month (handle December → January rollover)
                    const drawMonth = month === 12 ? 1 : month + 1;
                    const drawYear = month === 12 ? year + 1 : year;
                    const drawDate = `${drawYear}-${String(drawMonth).padStart(2, "0")}-01`;
                    
                    // Fill the form fields
                    setValue("startsOn", startDate);
                    setValue("endsOn", endDate);
                    setValue("drawDate", drawDate);
                  }}
                  placeholder="Select a month..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Selects a calendar month. Fills Start (1st), End (last day), and Draw Date (1st of next month). All dates remain editable.
                </p>
              </div>
              
              <FormGrid>
                <AdminInput
                  label="Start Date"
                  type="date"
                  {...register("startsOn", { required: "Start date is required" })}
                  error={errors.startsOn?.message}
                />
                <AdminInput
                  label="End Date"
                  type="date"
                  {...register("endsOn", { required: "End date is required" })}
                  error={errors.endsOn?.message}
                />
              </FormGrid>
              <AdminInput
                label="Draw Date"
                type="date"
                {...register("drawDate", { required: "Draw date is required" })}
                error={errors.drawDate?.message}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usually the 1st of the next month. You can set the 1st to the 3rd.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Dates are UTC, inclusive. Winners can be selected from the day after the End Date, once the draw is closed.
              </p>
              
              {/* Live summary once all three dates are set */}
              {watch("startsOn") && watch("endsOn") && watch("drawDate") && (
                <div className="mt-2 p-2 bg-primary/10 rounded-lg text-xs text-foreground">
                  <strong>Summary:</strong> Players qualify from {formatDrawDate(watch("startsOn"))} to {formatDrawDate(watch("endsOn"))}. Draw date {formatDrawDate(watch("drawDate"))}.
                </div>
              )}
            </ModalSection>

            <ModalSection title="Winners">
              {!useTiers && (
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
              )}
              {useTiers && (
                <div className="bg-secondary/20 rounded-lg p-3 text-[13px]">
                  <p className="font-medium">Total Winners (read-only): {watch("maxWinners")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically calculated as sum of all tier winners
                  </p>
                </div>
              )}
            </ModalSection>

            <ModalSection title="Prize Tiers (Optional)">
              <p className="text-xs text-muted-foreground mb-3">
                Add multiple prize tiers (Gold, Silver, Bronze, etc.). Leave empty for single-prize draw.
              </p>
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Tier {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Hidden position field - auto-calculated */}
                  <input type="hidden" {...register(`tiers.${index}.position`)} value={index + 1} />
                  <FormGrid>
                    <AdminInput
                      label="Tier Name"
                      {...register(`tiers.${index}.tierName`, { required: "Tier name is required" })}
                      placeholder="Gold"
                      error={errors.tiers?.[index]?.tierName?.message}
                    />
                    <AdminInput
                      label="Winners Count"
                      type="number"
                      {...register(`tiers.${index}.winnersCount`, { 
                        required: "Count is required",
                        valueAsNumber: true,
                        min: { value: 1, message: "Must be at least 1" },
                      })}
                      placeholder="1"
                      error={errors.tiers?.[index]?.winnersCount?.message}
                    />
                  </FormGrid>
                  <AdminInput
                    label="Prize Name"
                    {...register(`tiers.${index}.prizeName`, { required: "Prize name is required" })}
                    placeholder="iPhone 15 Pro"
                    error={errors.tiers?.[index]?.prizeName?.message}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => append({ position: fields.length + 1, tierName: "", prizeName: "", winnersCount: 1 })}
              >
                Add Tier
              </Button>
            </ModalSection>
          </form>
        </AdminModal>
      </div>
    );
  }

  // Detail, standings, winners views
  if (!selectedDraw) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="md" icon={<ArrowLeft size={16} />} onClick={backToList}>
          Back to List
        </Button>
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
          No draw selected
        </div>
      </div>
    );
  }

  const actions = getActions(selectedDraw);

  if (viewMode === "detail") {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" icon={<ArrowLeft size={16} />} onClick={backToList}>
            Back
          </Button>
          <h1 className="text-xl font-semibold">{selectedDraw.prizeName}</h1>
          <StatusBadge status={selectedDraw.status} />
        </div>

        {/* Success Message with Result Summary */}
        {successMessage && (
          <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg p-4 text-[var(--success)] flex items-start gap-3 text-[13px]">
            <CheckCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{successMessage}</p>
              {resultSummary && (
                <p className="text-xs mt-1 opacity-90">{resultSummary}</p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px] flex items-start gap-3">
            <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Draw Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">Draw Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                <div>
                  <div className="text-muted-foreground mb-1">Raffle Code</div>
                  <div className="font-medium">{selectedDraw.raffleCode}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Schedule</div>
                  <div className="font-medium">{selectedDraw.scheduleLabel}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Qualifying Period</div>
                  <div className="font-medium">
                    {formatDrawDate(selectedDraw.startsOn)} - {formatDrawDate(selectedDraw.endsOn)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Draw Date</div>
                  <div className="font-medium">{formatDrawDate(selectedDraw.drawDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Entry Count</div>
                  <div className="font-medium">{(selectedDraw.entryCount ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Max Winners</div>
                  <div className="font-medium">{selectedDraw.maxWinners}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Winners Selected</div>
                  <div className="font-medium">{selectedDraw.winnersSelected ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            {/* Prize Tiers */}
            {(selectedDraw.prizeTiers ?? []).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-4">Prize Tiers</h3>
                <div className="space-y-3">
                  {(selectedDraw.prizeTiers ?? [])
                    .sort((a, b) => a.position - b.position)
                    .map((tier, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[13px] p-2 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-semibold">{tier.tierName}</p>
                          <p className="text-muted-foreground text-xs">{tier.prizeName}</p>
                        </div>
                        <p className="font-medium">{tier.winnersCount} winner{tier.winnersCount !== 1 ? 's' : ''}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">Actions</h3>
              {actions.length > 0 ? (
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

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">Views</h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Users size={16} />}
                  onClick={handleViewStandings}
                  className="w-full justify-start"
                >
                  View Standings
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Trophy size={16} />}
                  onClick={handleViewWinners}
                  disabled={!selectedDraw.winnersSelected}
                  className="w-full justify-start"
                >
                  View Winners
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={showCloseDialog}
          onClose={() => setShowCloseDialog(false)}
          onConfirm={handleCloseDraw}
          title="Close Draw"
          description="Close the qualifying period? No more entries will be accepted. This action requires approval."
          confirmLabel="Yes, Close Draw"
          variant="danger"
          loading={submitting}
        />

        <ConfirmDialog
          open={showSelectWinnersDialog}
          onClose={() => setShowSelectWinnersDialog(false)}
          onConfirm={handleSelectWinners}
          title="Select Winners"
          description={`Select the top ${selectedDraw.maxWinners} scorer(s) as winners? Winners are chosen by points. This action requires approval from a checker.`}
          confirmLabel="Select Winners"
          variant="primary"
          loading={submitting}
        />
      </div>
    );
  }

  if (viewMode === "standings") {
    const hasTiers = selectedDraw.prizeTiers && selectedDraw.prizeTiers.length > 0;
    const maxWinners = selectedDraw.maxWinners;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" icon={<ArrowLeft size={16} />} onClick={backToDetail}>
            Back to Details
          </Button>
          <h1 className="text-xl font-semibold">Standings: {selectedDraw.prizeName}</h1>
        </div>

        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px] flex items-start gap-3">
            <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {detailLoading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            Loading standings...
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            No qualifying players yet
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Position</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-right py-3 px-4 font-medium">Points</th>
                  <th className="text-right py-3 px-4 font-medium">Correct Answers</th>
                  {hasTiers && <th className="text-left py-3 px-4 font-medium">Projected Tier</th>}
                </tr>
              </thead>
              <tbody>
                {(standings ?? []).map((entry) => {
                  const isWinningPosition = entry.position <= maxWinners;
                  const projectedTier = hasTiers ? getProjectedTier(entry.position, selectedDraw.prizeTiers ?? []) : null;
                  
                  return (
                    <tr 
                      key={entry.authUserId} 
                      className={cn(
                        "border-t border-border hover:bg-secondary/20",
                        isWinningPosition && "bg-primary/5"
                      )}
                    >
                      <td className={cn(
                        "py-3 px-4 font-bold",
                        isWinningPosition && "text-primary"
                      )}>
                        #{entry.position}
                      </td>
                      <td className="py-3 px-4">{entry.email}</td>
                      <td className="py-3 px-4 text-right font-semibold">{entry.points.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{entry.correctAnswers}</td>
                      {hasTiers && (
                        <td className="py-3 px-4">
                          {projectedTier ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {projectedTier}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "winners") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" icon={<ArrowLeft size={16} />} onClick={backToDetail}>
            Back to Details
          </Button>
          <h1 className="text-xl font-semibold">Winners: {selectedDraw.prizeName}</h1>
        </div>

        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-4 text-[var(--danger)] text-[13px] flex items-start gap-3">
            <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {detailLoading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            Loading winners...
          </div>
        ) : winners.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
            No winners selected yet
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Rank</th>
                  <th className="text-left py-3 px-4 font-medium">Display Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-right py-3 px-4 font-medium">Points</th>
                  {winners.some(w => w.tier || w.tierName) && <th className="text-left py-3 px-4 font-medium">Tier</th>}
                  {winners.some(w => w.prize || w.prizeName) && <th className="text-left py-3 px-4 font-medium">Prize</th>}
                  <th className="text-left py-3 px-4 font-medium">Selected At</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-secondary/20">
                    <td className="py-3 px-4 font-bold text-primary">
                      #{winner.rankPosition ?? idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium">{winner.displayName ?? "-"}</td>
                    <td className="py-3 px-4">{winner.email ?? "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{winner.phoneNumber ?? "-"}</td>
                    <td className="py-3 px-4 font-semibold text-right">{winner.points?.toLocaleString() ?? "-"}</td>
                    {winners.some(w => w.tier || w.tierName) && (
                      <td className="py-3 px-4">{winner.tierName ?? winner.tier ?? "-"}</td>
                    )}
                    {winners.some(w => w.prize || w.prizeName) && (
                      <td className="py-3 px-4">{winner.prizeName ?? winner.prize ?? "-"}</td>
                    )}
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {winner.selectedAt ? new Date(winner.selectedAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
}
