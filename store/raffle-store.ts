import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Raffle {
  id: string;
  prizeName: string;
  prizeImage?: string;
  description: string;
  costPerTicket: number;
  drawDate: string;
  totalTickets: number;
  ticketsSold: number;
  status: "active" | "ended";
}

export interface UserRaffleTicket {
  raffleId: string;
  ticketCount: number;
}

interface RaffleState {
  raffles: Raffle[];
  userTickets: UserRaffleTicket[];
  addRaffle: (raffle: Raffle) => void;
  purchaseTicket: (raffleId: string) => { success: boolean; message: string };
  getUserTicketsForRaffle: (raffleId: string) => number;
}

const MOCK_RAFFLES: Raffle[] = [
  {
    id: "iphone-15-pro",
    prizeName: "iPhone 15 Pro Max",
    description: "Win the latest iPhone 15 Pro Max. Draw happens every Friday at 8 PM WAT.",
    costPerTicket: 500,
    drawDate: "Friday, 8 PM",
    totalTickets: 1000,
    ticketsSold: 342,
    status: "active",
  },
  {
    id: "cash-prize-50k",
    prizeName: "₦50,000 Cash Prize",
    description: "Win ₦50,000 cash directly to your account. Draw every Monday at 6 PM WAT.",
    costPerTicket: 300,
    drawDate: "Monday, 6 PM",
    totalTickets: 500,
    ticketsSold: 189,
    status: "active",
  },
  {
    id: "samsung-tv",
    prizeName: "Samsung 55\" Smart TV",
    description: "Premium 4K Smart TV for your home entertainment. Draw every Wednesday.",
    costPerTicket: 400,
    drawDate: "Wednesday, 7 PM",
    totalTickets: 800,
    ticketsSold: 267,
    status: "active",
  },
];

export const useRaffleStore = create<RaffleState>()(
  persist(
    (set, get) => ({
      // TODO: replace with GET /raffles once the backend is live
      raffles: MOCK_RAFFLES,
      userTickets: [],

      addRaffle: (raffle) =>
        set((state) => ({
          raffles: [...state.raffles, raffle],
        })),

      purchaseTicket: (raffleId) => {
        const state = get();
        const raffle = state.raffles.find((r) => r.id === raffleId);

        if (!raffle) {
          return { success: false, message: "Raffle not found" };
        }

        if (raffle.status !== "active") {
          return { success: false, message: "This raffle is no longer active" };
        }

        if (raffle.ticketsSold >= raffle.totalTickets) {
          return { success: false, message: "All tickets sold out" };
        }

        // Update user tickets
        const existingTicket = state.userTickets.find((t) => t.raffleId === raffleId);
        const newUserTickets = existingTicket
          ? state.userTickets.map((t) =>
              t.raffleId === raffleId ? { ...t, ticketCount: t.ticketCount + 1 } : t
            )
          : [...state.userTickets, { raffleId, ticketCount: 1 }];

        // Update raffle tickets sold count
        const newRaffles = state.raffles.map((r) =>
          r.id === raffleId ? { ...r, ticketsSold: r.ticketsSold + 1 } : r
        );

        set({
          userTickets: newUserTickets,
          raffles: newRaffles,
        });

        return { success: true, message: "Ticket purchased successfully!" };
      },

      getUserTicketsForRaffle: (raffleId) => {
        const ticket = get().userTickets.find((t) => t.raffleId === raffleId);
        return ticket?.ticketCount ?? 0;
      },
    }),
    { name: "raffle-storage" }
  )
);
