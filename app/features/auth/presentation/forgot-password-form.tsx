"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as authApi from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      await authApi.forgotPassword({ email: data.email });
      setSent(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Something went wrong. Try again shortly.");
    }
  };

  if (sent) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        If an account exists for that email, a reset code is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Email Address</label>
        <Input type="email" placeholder="player@example.com" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
        {isSubmitting ? "Sending..." : "Send Reset Code"}
      </Button>
    </form>
  );
}