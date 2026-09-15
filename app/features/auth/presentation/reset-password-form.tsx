"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/validations/auth";
import { simulateRequest } from "@/lib/api/simulate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const token = searchParams.get("token") ?? "";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (_data: ResetPasswordInput) => {
    setError(null);
    try {
      // TODO: swap back to apiClient("/auth/reset-password", ...) once the backend exists.
      await simulateRequest({ ok: true });
      router.push("/login");
    } catch {
      setError("That reset link may have expired. Request a new one.");
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