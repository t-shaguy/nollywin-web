import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { appFont } from "./fonts";

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
    <html lang="en" className={`dark ${appFont.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}