"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useRaffleDrawStore } from "@/store/raffle-draw-store";
import { simulateRequest } from "@/lib/api/simulate";

interface ManageDrawForm {
  prize: string;
  entries: number;
  drawDate: string;
  costPerTicket: number;
}

interface CreateDrawForm {
  prizeName: string;
  ticketCost: number;
}

export default function AdminRewardsPage() {
  const { activeDraw, updateDraw, createDraw } = useRaffleDrawStore();
  const [showManageModal, setShowManageModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { register: registerManage, handleSubmit: handleSubmitManage, reset: resetManage } = useForm<ManageDrawForm>({
    defaultValues: activeDraw ? {
      prize: activeDraw.prize,
      entries: activeDraw.entries,
      drawDate: activeDraw.drawDate,
      costPerTicket: activeDraw.costPerTicket,
    } : undefined,
  });

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate } } = useForm<CreateDrawForm>();

  const handleManageDrawOpen = () => {
    if (activeDraw) {
      resetManage({
        prize: activeDraw.prize,
        entries: activeDraw.entries,
        drawDate: activeDraw.drawDate,
        costPerTicket: activeDraw.costPerTicket,
      });
    }
    setShowManageModal(true);
  };

  const handleManageDrawSubmit = async (data: ManageDrawForm) => {
    setIsUpdating(true);
    try {
      // TODO: replace with real API call once the backend exists
      await simulateRequest({ success: true }, 800);
      updateDraw(data);
      setShowManageModal(false);
    } catch {
      // Error handling
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateDraw = async (data: CreateDrawForm) => {
    setIsCreating(true);
    try {
      // TODO: replace with real API call once the backend exists
      await simulateRequest({ success: true }, 800);
      createDraw(data.prizeName, data.ticketCost);
      resetCreate();
    } catch {
      // Error handling
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Rewards</h1>
        <p className="text-muted-foreground mt-2">Manage raffle draws and prizes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Raffle Draw Card */}
        {activeDraw && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-bold">Active Raffle Draw</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Prize</span>
                <span className="font-medium">{activeDraw.prize}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Entries</span>
                <span className="font-medium">{activeDraw.entries} tickets</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Draw Date</span>
                <span className="font-medium">{activeDraw.drawDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Cost per Ticket</span>
                <span className="font-medium">{activeDraw.costPerTicket.toLocaleString()} points</span>
              </div>
            </div>

            <Button
              onClick={handleManageDrawOpen}
              variant="outline"
              className="w-full justify-center border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Manage Draw
            </Button>
          </div>
        )}

        {/* Create New Draw Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-5">Create New Draw</h2>
          
          <form onSubmit={handleSubmitCreate(handleCreateDraw)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prize Name</label>
              <Input
                {...registerCreate("prizeName", { required: "Prize name is required" })}
                placeholder="e.g. Samsung Galaxy S24"
              />
              {errorsCreate.prizeName && (
                <p className="text-destructive text-sm mt-1">{errorsCreate.prizeName.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ticket Cost (points)</label>
              <Input
                type="number"
                {...registerCreate("ticketCost", { 
                  required: "Ticket cost is required",
                  min: { value: 1, message: "Must be at least 1" },
                })}
                placeholder="5000"
              />
              {errorsCreate.ticketCost && (
                <p className="text-destructive text-sm mt-1">{errorsCreate.ticketCost.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full justify-center bg-destructive hover:bg-destructive/90"
            >
              {isCreating ? "Creating..." : "Create Draw"}
            </Button>
          </form>
        </div>
      </div>

      {/* Manage Draw Modal */}
      <Modal open={showManageModal} onClose={() => setShowManageModal(false)} title="Manage Active Draw">
        <div className="bg-card rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Manage Active Draw</h2>
            <button
              onClick={() => setShowManageModal(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitManage(handleManageDrawSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prize Name</label>
              <Input {...registerManage("prize")} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Entries (tickets sold)</label>
              <Input type="number" {...registerManage("entries")} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Draw Date/Time</label>
              <Input {...registerManage("drawDate")} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cost per Ticket (points)</label>
              <Input type="number" {...registerManage("costPerTicket")} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManageModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
