"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as authApi from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    if (!email || !code) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    
    try {
      await authApi.resetPassword({
        email,
        code,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      router.push("/auth?reset=success");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "That reset code may have expired. Request a new one.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      <div>
        <label className="text-sm text-foreground mb-1.5 block">New Password</label>
        <Input type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="text-sm text-foreground mb-1.5 block">Confirm Password</label>
        <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}