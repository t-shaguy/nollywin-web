"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validations/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as authApi from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

export function ChangePasswordForm({ lastChangedAt }: { lastChangedAt?: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setSaved(false);
    setError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSaved(true);
      reset(); // Clear form on success
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to update password");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-xs text-muted-foreground">Last changed: {lastChangedAt ?? "Not available yet"}</p>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Current Password</label>
        <Input type="password" {...register("currentPassword")} />
        {errors.currentPassword && <p className="text-destructive text-sm mt-1">{errors.currentPassword.message}</p>}
      </div>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">New Password</label>
        <Input type="password" {...register("newPassword")} />
        {errors.newPassword && <p className="text-destructive text-sm mt-1">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Confirm New Password</label>
        <Input type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>
      {saved && <p className="text-primary text-sm">Password updated successfully!</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
    </form>
  );
}