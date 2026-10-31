"use client";
import { Clock } from "lucide-react";
import { Raffle } from "@/store/raffle-store";

export function ActiveDrawCard({ 
  draw, 
  userTickets 
}: { 
  draw: Raffle;
  userTickets: number;
}) {
  return (
    <div
      className="border border-primary/20 rounded-2xl p-6 sm:p-8"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, rgba(236,20,105,0.28) 0%, rgba(236,20,105,0.10) 45%, transparent 75%)",
      }}
    >
      <div className="min-w-0">
        <h2 className="text-2xl font-extrabold break-words">{draw.prizeName}</h2>
        
        {/* Timeframe */}
        {draw.scheduleLabel && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={13} />
            <span>{draw.scheduleLabel}</span>
          </div>
        )}
        
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            You have <span className="text-primary font-semibold">{userTickets} {userTickets === 1 ? "ticket" : "tickets"}</span> for this draw.
          </p>
          
          <p className="text-sm">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {draw.entryCount} {draw.entryCount === 1 ? "entry" : "entries"} so far
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
