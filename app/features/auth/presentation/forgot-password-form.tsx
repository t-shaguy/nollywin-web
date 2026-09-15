"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/lib/validations/auth";
import { simulateRequest } from "@/lib/api/simulate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (_data: ForgotPasswordInput) => {
    setError(null);
    try {
      // TODO: swap back to apiClient("/auth/forgot-password", ...) once the backend exists.
      await simulateRequest({ ok: true });
      setSent(true);
    } catch {
      setError("Something went wrong. Try again shortly.");
    }
  };

  if (sent) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        If an account exists for that email, a reset link is on its way. Check your inbox.
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
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}