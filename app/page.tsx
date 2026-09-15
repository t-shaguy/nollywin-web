"use client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-32">
        <Badge>★ The Ultimate Nollywood Trivia Experience</Badge>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mt-8">
          <span className="text-foreground">Test your knowledge.</span>
          <br />
          <span className="text-brand-gradient">Win Real Rewards.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mt-6">
          Join thousands of players in the premium Nollywood trivia app. Answer fast,
          climb the leaderboards, enter exclusive raffles, and win BIG!!!
        </p>
        <Button className="mt-10" onClick={() => router.push("/auth")}>
          Play Now →
        </Button>
      </section>
    </main>
  );
}