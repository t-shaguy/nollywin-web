"use client";
import { useState } from "react";
import { Star, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseTicketModal } from "./purchase-ticket-modal";
import { Raffle } from "@/store/raffle-store";

export function ActiveDrawCard({ 
  draw, 
  userTickets 
}: { 
  draw: Raffle;
  userTickets: number;
}) {
  const [showModal, setShowModal] = useState(false);

  const soldOutPercentage = Math.round((draw.entryCount / draw.maxWinners) * 100);

  return (
    <>
      <div
        className="border border-primary/20 rounded-2xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_260px] gap-6 sm:items-center"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(236,20,105,0.28) 0%, rgba(236,20,105,0.10) 45%, transparent 75%)",
        }}
      >
        <div className="min-w-0">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Ticket size={12} />
            Active Draw
          </span>
          <h2 className="text-2xl font-extrabold mt-4 break-words">{draw.prizeName}</h2>
          {/* No description field in verified backend response */}
          
          <div className="mt-4 space-y-2">
            <p className="text-sm">
              You have <span className="text-primary font-semibold">{userTickets} {userTickets === 1 ? "ticket" : "tickets"}</span> for this draw.
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary/50 transition-all"
                  style={{ width: `${soldOutPercentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {draw.entryCount}/{draw.maxWinners} entries
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">Cost per Ticket</p>
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold mt-2">
            <Star size={18} className="text-amber-500" />
            {draw.ticketCostTokens.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">tokens</p>
          <Button onClick={() => setShowModal(true)} className="w-full justify-center mt-4">
            Buy Ticket
          </Button>
        </div>
      </div>

      <PurchaseTicketModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        raffle={draw}
      />
    </>
  );
}
