"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CreditCard, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPaymentSettings, setPaymentCallbackUrl, type PaymentSetting } from "@/lib/api/admin";

interface CallbackFormData {
  channel: "WEB" | "MOBILE";
  callbackUrl: string;
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CallbackFormData>();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentSettings();
      console.log("Payment settings:", data);
      setSettings(data);
    } catch (err) {
      console.error("Error loading payment settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: CallbackFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // Validate HTTPS
      if (!data.callbackUrl.startsWith("https://")) {
        setError("Callback URL must start with https://");
        return;
      }

      const response = await setPaymentCallbackUrl(data.channel, data.callbackUrl);
      setSuccessMessage(response.message || "Payment callback URL updated successfully");
      reset();
      await loadSettings();
    } catch (err) {
      console.error("Error setting callback URL:", err);
      setError(err instanceof Error ? err.message : "Failed to set callback URL");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Payment Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure payment gateway callbacks and settings</p>
        </div>
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading payment settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payment Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure payment gateway callbacks and settings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-green-600 flex items-start gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Current Settings */}
      <div className="bg-card border border-border rounded p-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Current Settings</h2>
        </div>
        
        {/* TODO(tartor): Generic render until response shape confirmed */}
        {settings && settings.length > 0 ? (
          <div className="space-y-3">
            {settings.map((setting, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded border border-border/50">
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  {Object.entries(setting).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No settings available</p>
        )}
      </div>

      {/* Set Callback URL Form */}
      <div className="bg-card border border-border rounded p-4">
        <h2 className="text-sm font-semibold mb-4">Set Payment Callback URL</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Payment Channel</label>
            <select
              {...register("channel", { required: "Channel is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded text-[13px]"
            >
              <option value="">Select a channel</option>
              <option value="WEB">WEB</option>
              <option value="MOBILE">MOBILE</option>
            </select>
            {errors.channel && <p className="text-destructive text-xs mt-1">{errors.channel.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Callback URL</label>
            <Input
              {...register("callbackUrl", { 
                required: "Callback URL is required",
                pattern: {
                  value: /^https:\/\/.+/,
                  message: "Must be a valid HTTPS URL"
                }
              })}
              placeholder="https://api.nollywin.com/webhooks/payment"
            />
            {errors.callbackUrl && <p className="text-destructive text-sm mt-1">{errors.callbackUrl.message}</p>}
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs text-yellow-600 font-medium">🔒 Security Requirement</p>
              <p className="text-xs text-muted-foreground mt-1">
                Only HTTPS URLs are allowed for payment callbacks. HTTP URLs will be rejected.
              </p>
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Saving..." : "Set Callback URL"}
          </Button>
        </form>
      </div>
    </div>
  );
}
