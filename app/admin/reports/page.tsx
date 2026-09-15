"use client";
import { useState } from "react";
import { FileBarChart2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateRequest } from "@/lib/api/simulate";

export default function ReportsPage() {
  const [subReportLoading, setSubReportLoading] = useState(false);
  const [gameplayReportLoading, setGameplayReportLoading] = useState(false);
  const [subReportSuccess, setSubReportSuccess] = useState(false);
  const [gameplayReportSuccess, setGameplayReportSuccess] = useState(false);

  const handleGenerateSubReport = async () => {
    setSubReportLoading(true);
    setSubReportSuccess(false);
    // TODO: replace with real apiClient("/admin/reports/subscription", ...) once backend exists
    await simulateRequest({ ok: true }, 1000);
    setSubReportLoading(false);
    setSubReportSuccess(true);
    setTimeout(() => setSubReportSuccess(false), 5000);
  };

  const handleGenerateGameplayReport = async () => {
    setGameplayReportLoading(true);
    setGameplayReportSuccess(false);
    // TODO: replace with real apiClient("/admin/reports/gameplay", ...) once backend exists
    await simulateRequest({ ok: true }, 1000);
    setGameplayReportLoading(false);
    setGameplayReportSuccess(true);
    setTimeout(() => setGameplayReportSuccess(false), 5000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and view platform analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Reports */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <FileBarChart2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Subscription Reports</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Generate detailed reports on subscription trends, revenue, and user plan distribution
          </p>
          {subReportSuccess && (
            <div className="bg-primary/10 border border-primary text-primary rounded-xl p-3 text-sm font-medium mb-4">
              Report generated — check your email
            </div>
          )}
          <Button
            onClick={handleGenerateSubReport}
            disabled={subReportLoading}
            variant="gradient"
            className="w-full justify-center"
          >
            {subReportLoading ? "Generating..." : "Generate Sub Report"}
          </Button>
        </div>

        {/* Gameplay Reports */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Gamepad2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Gameplay Reports</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Analyze trivia performance, question difficulty, and player engagement metrics
          </p>
          {gameplayReportSuccess && (
            <div className="bg-primary/10 border border-primary text-primary rounded-xl p-3 text-sm font-medium mb-4">
              Report generated — check your email
            </div>
          )}
          <Button
            onClick={handleGenerateGameplayReport}
            disabled={gameplayReportLoading}
            variant="gradient"
            className="w-full justify-center"
          >
            {gameplayReportLoading ? "Generating..." : "Generate Gameplay Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
