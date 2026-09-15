"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { simulateRequest } from "@/lib/api/simulate";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      // TODO: swap back to apiClient("/auth/login", { method: "POST", body: JSON.stringify(data) })
      // once the real endpoint exists — this simulates a successful login so the flow is testable end-to-end.
      const res = await simulateRequest({ token: "dev-session-token", user: { email: data.email } });
      setSession(res.token, res.user);
      router.push("/home");
    } catch {
      setServerError("Couldn't log in. Check your details and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Email Address</label>
        <Input type="email" placeholder="player@example.com" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-sm text-foreground mb-1.5 block">Password</label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" {...register("rememberMe")} className="accent-primary" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
          Forgot password?
        </Link>
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
        {isSubmitting ? "Logging in..." : "Login with Password"}
      </Button>
    </form>
  );
}