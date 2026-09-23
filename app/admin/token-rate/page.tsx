"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Coins, CheckCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  getTokenExchangeRateHistory, 
  getCurrentTokenExchangeRate, 
  setTokenExchangeRate,
  type TokenExchangeRateEntry,
} from "@/lib/api/admin";

interface TokenRateFormData {
  koboPerToken: number;
}

export default function TokenRatePage() {
  const [currentRate, setCurrentRate] = useState<TokenExchangeRateEntry | null>(null);
  const [history, setHistory] = useState<TokenExchangeRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TokenRateFormData>();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [current, hist] = await Promise.all([
        getCurrentTokenExchangeRate(),
        getTokenExchangeRateHistory(),
      ]);
      
      setCurrentRate(current);
      setHistory(hist);
      
      // Pre-fill form with current rate
      reset({ koboPerToken: current.koboPerToken });
    } catch (err) {
      console.error("Error loading token rates:", err);
      setError(err instanceof Error ? err.message : "Failed to load token rates");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: TokenRateFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await setTokenExchangeRate(data.koboPerToken);
      setSuccessMessage(response.message || "Token exchange rate updated successfully");
      
      // Reload data
      await loadData();
    } catch (err) {
      console.error("Error setting token rate:", err);
      setError(err instanceof Error ? err.message : "Failed to set token rate");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-extrabold">Token Exchange Rate</h1>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading exchange rates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Token Exchange Rate</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Rate Display */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Coins size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Rate</p>
              <p className="text-2xl font-bold">
                {currentRate 
                  ? `₦${(currentRate.koboPerToken / 100).toFixed(2)}`
                  : "Not Set"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Per token</p>
        </div>

        {/* Set New Rate Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Set New Exchange Rate</h2>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rate (Kobo per Token)</label>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  step="0.01"
                  {...register("koboPerToken", { 
                    required: "Rate is required", 
                    valueAsNumber: true, 
                    min: { value: 0.01, message: "Must be greater than 0" } 
                  })} 
                  placeholder="100"
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  variant="gradient" 
                  className="gap-2 px-8" 
                  disabled={submitting}
                >
                  <Coins size={16} />
                  {submitting ? "Setting..." : "Set Rate"}
                </Button>
              </div>
              {errors.koboPerToken && (
                <p className="text-destructive text-sm mt-1">{errors.koboPerToken.message}</p>
              )}
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-600 font-medium">⚠️ Financial Operation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This affects real monetary transactions. Example: 100 kobo = ₦1.00 per token.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Rate History Table */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Rate Change History</h2>
        
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Effective From</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rate (Kobo)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rate (Naira)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 text-sm">
                      {new Date(entry.effectiveFrom).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {entry.koboPerToken.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      ₦{(entry.koboPerToken / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No rate history available
          </div>
        )}
      </div>
    </div>
  );
}
