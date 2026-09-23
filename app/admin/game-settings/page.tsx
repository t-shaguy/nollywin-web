"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGameSettings, updateGameSettings, type UpdateGameSettingsRequest, type GameSettings } from "@/lib/api/admin";

interface GameSettingsFormData {
  pointsPerCorrectAnswer: number;
  secondsPerQuestion: number;
}

export default function GameSettingsPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GameSettingsFormData>();

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const data = await getGameSettings();
        setSettings(data);
        
        // Extract the two known editable fields
        reset({
          pointsPerCorrectAnswer: data.pointsPerCorrectAnswer,
          secondsPerQuestion: data.secondsPerQuestion,
        });
      } catch (err) {
        console.error("Error loading game settings:", err);
        setError(err instanceof Error ? err.message : "Failed to load game settings");
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: GameSettingsFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: UpdateGameSettingsRequest = {
        pointsPerCorrectAnswer: data.pointsPerCorrectAnswer,
        secondsPerQuestion: data.secondsPerQuestion,
      };

      const response = await updateGameSettings(payload);
      setSuccessMessage(response.message || "Game settings updated successfully");
    } catch (err) {
      console.error("Error updating game settings:", err);
      setError(err instanceof Error ? err.message : "Failed to update game settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-extrabold">Game Settings</h1>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading game settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Game Settings</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Gameplay Configuration</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          <div>
            <label className="text-sm font-medium mb-2 block">Points Per Correct Answer</label>
            <Input 
              type="number" 
              {...register("pointsPerCorrectAnswer", { 
                required: "Points value is required", 
                valueAsNumber: true, 
                min: { value: 1, message: "Must be at least 1" } 
              })} 
              placeholder="10"
            />
            {errors.pointsPerCorrectAnswer && (
              <p className="text-destructive text-sm mt-1">{errors.pointsPerCorrectAnswer.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              How many points players earn for each correct answer
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Seconds Per Question</label>
            <Input 
              type="number" 
              {...register("secondsPerQuestion", { 
                required: "Time limit is required", 
                valueAsNumber: true, 
                min: { value: 5, message: "Must be at least 5 seconds" },
                max: { value: 300, message: "Must be 300 seconds or less" }
              })} 
              placeholder="30"
            />
            {errors.secondsPerQuestion && (
              <p className="text-destructive text-sm mt-1">{errors.secondsPerQuestion.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Time limit for answering each question (5-300 seconds)
            </p>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full justify-center gap-2" 
            disabled={submitting}
          >
            <Save size={16} />
            {submitting ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </div>

      {/* Leaderboard Reset Day (Read-only) */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard Schedule</h2>
        <div className="p-4 bg-secondary/30 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Leaderboard resets every</p>
          <p className="text-lg font-semibold">
            {(() => {
              if (!loading && settings) {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                return days[settings.leaderboardResetDay % 7] || "Not configured";
              }
              return "—";
            })()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This setting is read-only. Contact system admin to change.
          </p>
        </div>
      </div>
    </div>
  );
}
