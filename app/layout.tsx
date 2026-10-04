import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAuthProvider } from "@/components/providers/google-auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NollyWin - Test Your Knowledge, Win Real Rewards",
  description: "The ultimate Nollywood trivia experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${geistMono.variable}`}>
      <body>
        <QueryProvider>
          <ToastProvider>
            <GoogleAuthProvider>{children}</GoogleAuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}