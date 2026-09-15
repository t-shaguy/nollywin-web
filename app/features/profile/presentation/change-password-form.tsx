"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validations/profile";
import { apiClient } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm({ lastChangedAt }: { lastChangedAt?: string }) {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setSaved(false);
    try {
      await apiClient("/users/password", { method: "PUT", body: JSON.stringify(data) });
      setSaved(true);
    } catch {
      // TODO: error toast once backend is live
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
      {saved && <p className="text-primary text-sm">Password updated.</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
    </form>
  );
}