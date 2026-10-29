"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Coins, CheckCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
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
      <div className="space-y-6">
        <AdminPageHeader 
          title="Token Exchange Rate" 
          description="Manage the token-to-naira conversion rate"
        />
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading exchange rates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Token Exchange Rate" 
        description="Manage the token-to-naira conversion rate"
      />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-muted/50 border border-border rounded p-4 flex items-start gap-3">
          <CheckCircle size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-foreground">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Rate Display */}
        <div className="bg-card border border-border rounded p-4">
          <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center mb-3">
            <Coins size={16} className="text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Rate</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {currentRate ? `₦${(currentRate.koboPerToken / 100).toFixed(2)}` : "Not Set"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">per token</p>
        </div>

        {/* Set New Rate Form */}
        <div className="bg-card border border-border rounded p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Set New Exchange Rate</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Rate (Kobo per Token)</label>
              <div className="flex gap-2">
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
                  disabled={submitting}
                  variant="gradient"
                  size="sm"
                  className="!rounded"
                >
                  {submitting ? "Saving..." : "Update Rate"}
                </Button>
              </div>
              {errors.koboPerToken && (
                <p className="text-destructive text-xs mt-1">{errors.koboPerToken.message}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Financial operation. Example: 100 kobo = ₦1.00 per token
            </p>
          </form>
        </div>
      </div>

      {/* Rate History Table */}
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-sm font-semibold mb-3">Rate Change History</h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Effective From</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rate (Kobo)</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rate (Naira)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="py-2 px-3">
                      {new Date(entry.effectiveFrom).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-medium tabular-nums">
                      {entry.koboPerToken.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 tabular-nums">
                      ₦{(entry.koboPerToken / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No rate history available
          </div>
        )}
      </div>
    </div>
  );
}
