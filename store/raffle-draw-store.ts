import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RaffleDraw {
  prize: string;
  entries: number; // Number of tickets sold
  drawDate: string;
  costPerTicket: number; // Cost in points
}

interface RaffleDrawState {
  activeDraw: RaffleDraw | null;
  updateDraw: (draw: Partial<RaffleDraw>) => void;
  createDraw: (prize: string, costPerTicket: number) => void;
}

// Initial active draw matching the spec
const INITIAL_DRAW: RaffleDraw = {
  prize: "iPhone 15 Pro Max",
  entries: 342,
  drawDate: "Every Friday 8PM",
  costPerTicket: 5000,
};

export const useRaffleDrawStore = create<RaffleDrawState>()(
  persist(
    (set) => ({
      // TODO: replace with GET /admin/raffle/active once the backend exists
      activeDraw: INITIAL_DRAW,

      updateDraw: (draw) =>
        set((state) => ({
          activeDraw: state.activeDraw ? { ...state.activeDraw, ...draw } : null,
        })),

      createDraw: (prize, costPerTicket) =>
        set({
          activeDraw: {
            prize,
            entries: 0,
            drawDate: "Every Friday 8PM",
            costPerTicket,
          },
        }),
    }),
    { name: "raffle-draw-storage" }
  )
);
