"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useWalletStore } from "@/store/wallet-store";
import { simulateRequest } from "@/lib/api/simulate";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { tokens } = useWalletStore();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0 && confirmPassword.length > 0;
  const passwordsValid = newPassword.length >= 6 && confirmPassword.length >= 6;
  const canSubmit = passwordsMatch && passwordsValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setIsUpdating(true);
    
    try {
      // TODO: replace with real API call once the backend exists
      await simulateRequest({ success: true }, 1000);
      router.push("/profile");
    } catch {
      // Error handling
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Change Password</h1>
            <p className="text-xs text-muted-foreground">Secure your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="text-xs font-medium mb-2 block uppercase tracking-wide text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-12 pr-12 py-3 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-medium mb-2 block uppercase tracking-wide text-muted-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-12 pr-12 py-3 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || isUpdating}
            className={`w-full justify-center text-sm py-3 rounded-lg font-medium transition-colors ${
              canSubmit && !isUpdating
                ? "bg-gradient-to-r from-[#F50B7A] to-[#FC0D28] text-white hover:opacity-90"
                : "bg-secondary/50 text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isUpdating ? "Updating..." : canSubmit ? "Update Password" : "Enter matching passwords to continue"}
          </button>
        </form>
      </div>
  );
}
