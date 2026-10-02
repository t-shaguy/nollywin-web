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
      <div className="space-y-4 sm:space-y-5">
        <AdminPageHeader title="Token Exchange Rate" />
        <AdminCard>
          <div className="py-8 flex items-center justify-center">
            <div className="text-muted-foreground text-xs">Loading exchange rates...</div>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AdminPageHeader title="Token Exchange Rate" />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-xs sm:text-sm text-foreground">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 sm:p-4 text-destructive text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Current Rate Display */}
        <AdminStatCard
          icon={Coins}
          label="Current Rate"
          value={currentRate ? `₦${(currentRate.koboPerToken / 100).toFixed(2)}` : "Not Set"}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-500/10"
        />

        {/* Set New Rate Form */}
        <AdminCard title="Set New Exchange Rate" className="lg:col-span-2">
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
                  className="flex-1 h-9 text-sm"
                />
                <Button 
                  type="submit" 
                  disabled={submitting}
                  variant="gradient"
                  size="sm"
                  className="h-9 px-4"
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
        </AdminCard>
      </div>

      {/* Rate History Table */}
      <AdminCard title="Rate Change History">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Effective From</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Rate (Kobo)</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Rate (Naira)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2 px-3 text-xs">
                      {new Date(entry.effectiveFrom).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-xs font-medium">
                      {entry.koboPerToken.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      ₦{(entry.koboPerToken / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No rate history available
          </div>
        )}
      </AdminCard>
    </div>
  );
}
